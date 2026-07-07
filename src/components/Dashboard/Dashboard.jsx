import { useState, useMemo, useRef } from 'react'
import IntegrityReport from '../common/IntegrityReport'
import AnalysisInsight from '../common/AnalysisInsight'
import FilterBar from './FilterBar'
import SummaryCards from './SummaryCards'
import ROITable from './ROITable'
import CountryAnalysis from './CountryAnalysis'
import TrendChart from '../Charts/TrendChart'
import RetentionChart from '../Charts/RetentionChart'
import CpaArpuChart from '../Charts/CpaArpuChart'
import LtvChart from '../Charts/LtvChart'
import MonetizationChart from '../Charts/MonetizationChart'
import RoiPredictionCard from './RoiPredictionCard'
import BreakEvenTargetTable from './BreakEvenTargetTable'
import { predictAllWeeks } from '../../services/roiPredictor'
import { aggregateByGroup, aggregateByWeek, getCurrentWeekData, getWeekOptions, getWeekDataByRange, getWeekRows } from '../../services/aggregator'
import {
  analyzeROITrend,
  analyzeRetentionTrend,
  analyzeCpaArpu,
  analyzeLtv,
  analyzeMonetization,
  analyzeROITable,
  analyzeCountry,
  analyzeROIDrivers,
  analyzeLTVDrivers
} from '../../services/analysisGenerator'
import { exportToPDF } from '../../utils/pdfExport'
import { exportToHTML } from '../../utils/htmlExport'

function Dashboard({ data, report, exportDate, hasMediaField = true, hasCountryField = true }) {
  const [filters, setFilters] = useState({
    media: '全部',
    appName: '全部',
    country: '全部'
  })
  
  const [showIntegrityReport, setShowIntegrityReport] = useState(false)
  const [selectedWeekKey, setSelectedWeekKey] = useState(null) // null = 默认最近一周
  const [showAnalysis, setShowAnalysis] = useState(true) // 是否显示分析洞察
  const [vatMode, setVatMode] = useState(false) // 是否扣除增值税
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const reportRef = useRef(null)
  
  // 获取筛选后的数据
  const filteredData = useMemo(() => {
    return (data || []).filter(row => {
      if (hasMediaField && filters.media !== '全部' && row['媒体'] !== filters.media) return false
      if (filters.appName !== '全部' && row['应用名称'] !== filters.appName) return false
      if (hasCountryField && filters.country !== '全部' && row['国家'] !== filters.country) return false
      return true
    })
  }, [data, filters, hasMediaField, hasCountryField])
  
  // 获取所有筛选选项（排除自然量，仅显示存在的字段）
  const filterOptions = useMemo(() => {
    const medias = hasMediaField 
      ? [...new Set((data || []).map(r => r['媒体']).filter(Boolean))].filter(m => m !== '自然量')
      : []
    const appNames = [...new Set((data || []).map(r => r['应用名称']).filter(Boolean))]
    // 国家按消耗额降序排列
    let countries = []
    if (hasCountryField) {
      const spendByCountry = {}
      ;(data || []).forEach(r => {
        const c = r['国家']
        if (!c) return
        spendByCountry[c] = (spendByCountry[c] || 0) + (Number(r['消耗($)']) || 0)
      })
      countries = Object.entries(spendByCountry)
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c)
    }
    
    return {
      media: hasMediaField ? ['全部', ...medias] : [],
      appName: ['全部', ...appNames],
      country: hasCountryField ? ['全部', ...countries] : []
    }
  }, [data, hasMediaField, hasCountryField])
  
  // 可选周列表
  const weekOptions = useMemo(() => {
    return getWeekOptions(filteredData)
  }, [filteredData])
  
  // 默认选中最新的周
  const defaultWeekKey = weekOptions.length > 0 ? weekOptions[0].weekKey : null
  const activeWeekKey = selectedWeekKey || defaultWeekKey
  
  // 当前选中周的数据
  const currentWeekData = useMemo(() => {
    const selectedOption = weekOptions.find(w => w.weekKey === activeWeekKey)
    if (selectedOption) {
      return getWeekDataByRange(filteredData, selectedOption, { vatMode })
    }
    return getCurrentWeekData(filteredData, exportDate, { vatMode })
  }, [filteredData, exportDate, activeWeekKey, weekOptions, vatMode])
  
  // 按产品聚合
  const productData = useMemo(() => {
    return aggregateByGroup(filteredData, 'appName', { vatMode })
  }, [filteredData, vatMode])
  
  // 按周趋势
  const weeklyData = useMemo(() => {
    return aggregateByWeek(filteredData, { vatMode })
  }, [filteredData, vatMode])
  
  // 选中周的产品数据（剔除非完整数据）
  const selectedWeekProductData = useMemo(() => {
    const selectedOption = weekOptions.find(w => w.weekKey === activeWeekKey)
    if (!selectedOption) return []
    
    const weekRows = getWeekRows(filteredData, selectedOption)
    return aggregateByGroup(weekRows, 'appName', { vatMode })
  }, [filteredData, activeWeekKey, weekOptions, vatMode])
  
  // 选中周的国家数据（剔除非完整数据）
  const selectedWeekCountryData = useMemo(() => {
    const selectedOption = weekOptions.find(w => w.weekKey === activeWeekKey)
    if (!selectedOption) return []
    
    const weekRows = getWeekRows(filteredData, selectedOption)
    return aggregateByGroup(weekRows, 'country', { vatMode })
  }, [filteredData, activeWeekKey, weekOptions, vatMode])

  // 分析洞察
  const analyses = useMemo(() => {
    if (!showAnalysis) return {}
    return {
      roiTrend: analyzeROITrend(weeklyData),
      retentionTrend: analyzeRetentionTrend(weeklyData),
      cpaArpu: analyzeCpaArpu(weeklyData),
      ltv: analyzeLtv(weeklyData),
      monetization: analyzeMonetization(weeklyData),
      roiTable: analyzeROITable(selectedWeekProductData),
      country: hasCountryField ? analyzeCountry(selectedWeekCountryData) : null,
      roiDrivers: analyzeROIDrivers(weeklyData),
      ltvDrivers: analyzeLTVDrivers(weeklyData)
    }
  }, [showAnalysis, weeklyData, selectedWeekProductData, selectedWeekCountryData, hasCountryField])

  // ROI预测
  const roiPredictions = useMemo(() => {
    return predictAllWeeks(weeklyData)
  }, [weeklyData])

  // PDF 导出处理
  const handleExportPDF = async () => {
    if (exporting || !reportRef.current) return
    setExporting(true)
    setExportProgress(0)
    
    try {
      reportRef.current.classList.add('pdf-exporting')
      await exportToPDF(
        reportRef.current, 
        'IAP游戏买量财务分析报告',
        (progress) => setExportProgress(progress)
      )
    } catch (error) {
      alert(`导出失败: ${error.message}`)
    } finally {
      reportRef.current?.classList.remove('pdf-exporting')
      setExporting(false)
      setExportProgress(0)
    }
  }

  // HTML 导出处理
  const handleExportHTML = () => {
    try {
      exportToHTML({
        data,
        report,
        exportDate,
        fileName: 'IAP游戏买量财务分析报告',
        hasMediaField,
        hasCountryField,
        weeklyData,
        roiPredictions,
        analyses
      })
    } catch (error) {
      alert(`导出失败: ${error.message}`)
    }
  }

  return (
    <div>
      {/* 导出按钮 */}
      <div className="flex justify-end gap-3 mb-4 no-print" data-no-print>
        <button
          onClick={handleExportHTML}
          className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          导出 HTML 报告
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
            exporting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {exporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              导出中 {Math.round(exportProgress)}%
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 PDF 报告
            </>
          )}
        </button>
      </div>
      
      {/* 报告内容区域 */}
      <div ref={reportRef} data-pdf-content>
      {/* 数据完整性报告 - 不导出 */}
      <div data-no-print>
        {showIntegrityReport && (
          <div className="mb-6">
            <button
              onClick={() => setShowIntegrityReport(false)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              收起数据完整性报告
            </button>
            <IntegrityReport report={report} exportDate={exportDate} />
          </div>
        )}
        
        {!showIntegrityReport && (
          <button
            onClick={() => setShowIntegrityReport(true)}
            className="text-sm text-primary-600 hover:text-primary-700 mb-4"
          >
            显示数据完整性报告
          </button>
        )}
      </div>
      
      {/* 筛选栏 */}
      <div data-no-print>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          options={filterOptions}
          vatMode={vatMode}
          onVatModeChange={setVatMode}
          data={filteredData}
        />
      </div>
      
      {/* 周选择器 + 分析开关 */}
      <div className="flex items-center justify-between mb-4" data-no-print>
        {weekOptions.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">查看周：</label>
            <select
              value={activeWeekKey || ''}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {weekOptions.map((opt) => (
                <option key={opt.weekKey} value={opt.weekKey}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showAnalysis 
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {showAnalysis ? '📊 隐藏分析洞察' : '📊 显示分析洞察'}
        </button>
      </div>
      
      {/* 概览卡片 */}
      <SummaryCards
        data={currentWeekData}
        productData={selectedWeekProductData}
        exportDate={exportDate}
      />
      
      {/* ROI里程碑表格 - 分周列示 */}
      <ROITable products={selectedWeekProductData} weekLabel={currentWeekData?.weekRange} />
      {showAnalysis && <AnalysisInsight analysis={analyses.roiTable} compact />}
      
      {/* 国家投放分析 - 仅当存在国家字段时显示 */}
      {hasCountryField && (
        <>
          <CountryAnalysis data={selectedWeekCountryData} weekLabel={currentWeekData?.weekRange} />
          {showAnalysis && <AnalysisInsight analysis={analyses.country} compact />}
        </>
      )}
      
      {/* 趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI周趋势分析</h3>
          <TrendChart data={weeklyData} />
          {showAnalysis && <AnalysisInsight analysis={analyses.roiTrend} />}
          {showAnalysis && analyses.roiDrivers && <AnalysisInsight analysis={analyses.roiDrivers} />}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">留存率周趋势</h3>
          <RetentionChart data={filteredData} />
          {showAnalysis && <AnalysisInsight analysis={analyses.retentionTrend} />}
        </div>
      </div>
      
      {/* CPA / ARPU / LTV / 付费分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPA & DAU ARPU 趋势</h3>
          <CpaArpuChart data={weeklyData} />
          {showAnalysis && <AnalysisInsight analysis={analyses.cpaArpu} />}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">LTV 趋势分析</h3>
          <LtvChart data={weeklyData} />
          {showAnalysis && <AnalysisInsight analysis={analyses.ltv} />}
          {showAnalysis && analyses.ltvDrivers && <AnalysisInsight analysis={analyses.ltvDrivers} />}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">付费率 & ARPPU 趋势</h3>
          <MonetizationChart data={weeklyData} />
          {showAnalysis && <AnalysisInsight analysis={analyses.monetization} />}
        </div>
      </div>

      {/* ROI 预测分析 */}
      <RoiPredictionCard weeklyData={weeklyData} filteredData={filteredData} hasCountryField={hasCountryField} vatMode={vatMode} />

      {/* 各国 D30 回本目标表（独立β数据源 + 独立国家筛选） */}
      {hasCountryField && (
        <BreakEvenTargetTable
          data={data}
          hasCountryField={hasCountryField}
          hasMediaField={hasMediaField}
        />
      )}
      </div>{/* 关闭 reportRef */}
    </div>
  )
}

export default Dashboard
