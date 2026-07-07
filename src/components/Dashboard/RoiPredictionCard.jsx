import { useState, useMemo } from 'react'
import { predictAllWeeks, computeBreakEvenROI } from '../../services/roiPredictor'
import { aggregateByWeek } from '../../services/aggregator'
import { getVATRate } from '../../constants/vatRates'
import RoiPredictionChart from '../Charts/RoiPredictionChart'

function ConfidenceBadge({ confidence }) {
  const config = {
    actual: { bg: 'bg-gray-100', text: 'text-gray-700', label: '已实测' },
    high: { bg: 'bg-green-100', text: 'text-green-700', label: '高' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '中' },
    low: { bg: 'bg-orange-100', text: 'text-orange-700', label: '低' },
    reference: { bg: 'bg-blue-50', text: 'text-blue-600', label: '参考' },
    multiplier: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '倍率' },
    none: { bg: 'bg-gray-50', text: 'text-gray-400', label: '数据不足' }
  }
  const c = config[confidence] || config.none
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function formatBreakEven(day) {
  if (day === null || day === undefined) return '无法回本'
  return `D${day}`
}

function RoiPredictionCard({ weeklyData, filteredData, hasCountryField, vatMode }) {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)
  const [predCountry, setPredCountry] = useState('全部')
  const [localVatMode, setLocalVatMode] = useState(vatMode) // 卡片内独立 VAT 开关

  // 同步全局 vatMode
  useMemo(() => setLocalVatMode(vatMode), [vatMode])

  // 国家选项列表（按消耗额降序）
  const countryOptions = useMemo(() => {
    if (!hasCountryField || !filteredData) return []
    // 按国家汇总消耗
    const spendByCountry = {}
    filteredData.forEach(r => {
      const country = r['国家']
      if (!country) return
      const spend = Number(r['消耗($)']) || 0
      spendByCountry[country] = (spendByCountry[country] || 0) + spend
    })
    // 按消耗降序排列
    const sorted = Object.entries(spendByCountry)
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country)
    return ['全部', ...sorted]
  }, [filteredData, hasCountryField])

  // 始终从 filteredData 重新聚合，确保 VAT 切换生效
  const countryWeeklyData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return weeklyData
    let rows = filteredData
    if (predCountry !== '全部') {
      rows = filteredData.filter(r => r['国家'] === predCountry)
    }
    return aggregateByWeek(rows, { vatMode: localVatMode })
  }, [weeklyData, filteredData, predCountry, localVatMode])

  // 计算加权平均 VAT 率（按消耗加权）
  const avgVAT = useMemo(() => {
    if (!localVatMode || !filteredData) return 0
    let rows = filteredData
    if (predCountry !== '全部') {
      rows = filteredData.filter(r => r['国家'] === predCountry)
    }
    // 按消耗加权计算平均 VAT
    let totalSpend = 0, weightedVAT = 0
    rows.forEach(r => {
      if (r._isOrganic) return // 自然量无消耗
      const spend = Number(r['消耗($)']) || 0
      if (spend > 0) {
        totalSpend += spend
        weightedVAT += spend * getVATRate(r['国家'])
      }
    })
    return totalSpend > 0 ? weightedVAT / totalSpend : 0
  }, [filteredData, predCountry, localVatMode])

  // 回本线阈值：仅需考虑平台分成（VAT 已体现在 ROI 数据中）
  // ROI数据已扣除VAT（开启时）：net_ROI = gross_ROI / (1+VAT)
  // 回本条件：net_ROI × 0.70 = 1 → net_ROI = 1/0.70
  const breakEvenROI = useMemo(() => {
    return computeBreakEvenROI(0) // VAT已在数据中扣除，阈值只需平台分成
  }, [])

  // 批量预测所有周
  const predictions = useMemo(() => {
    return predictAllWeeks(countryWeeklyData, breakEvenROI)
  }, [countryWeeklyData, breakEvenROI])

  // 有效预测的周（至少有 2 个观测点）
  const validPredictions = useMemo(() => {
    return predictions.filter(p => p.prediction.confidence !== 'none')
  }, [predictions])

  // 默认选最新周
  useMemo(() => {
    if (validPredictions.length > 0) {
      const latestIdx = predictions.findIndex(p => p.weekKey === validPredictions[validPredictions.length - 1].weekKey)
      if (latestIdx >= 0) setSelectedWeekIdx(latestIdx)
    }
  }, [validPredictions])

  if (!weeklyData || weeklyData.length === 0 || predictions.length === 0) {
    return null
  }

  const selected = predictions[selectedWeekIdx]
  const pred = selected?.prediction

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-gray-900">ROI 预测分析</h3>
        <div className="flex items-center gap-3">
          {/* 含税/不含税切换 */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={localVatMode}
              onChange={(e) => setLocalVatMode(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-xs text-gray-600">扣除增值税</span>
          </label>
          {localVatMode && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">净收入</span>
          )}
          {/* 国家筛选 */}
          {countryOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">国家:</label>
              <select
                value={predCountry}
                onChange={(e) => { setPredCountry(e.target.value); setSelectedWeekIdx(0) }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {countryOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {/* 周选择器 */}
          <select
            value={selectedWeekIdx}
            onChange={(e) => setSelectedWeekIdx(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {predictions.map((p, i) => (
              <option key={p.weekKey} value={i}>
                {p.weekKey} {p.prediction.confidence === 'actual' ? '(已实测)' : `(D1~D${p.observations[p.observations.length - 1]?.day || '?'})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 单周拟合曲线图 */}
      {selected && (
        <RoiPredictionChart
          observations={selected.observations}
          prediction={selected.prediction}
          breakEvenROI={breakEvenROI}
        />
      )}

      {/* 关键指标 */}
      {pred && pred.confidence !== 'none' && (
        <div className="grid grid-cols-4 gap-3 mt-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">观测范围</div>
            <div className="text-sm font-semibold">
              D{selected.observations[0]?.day} ~ D{selected.observations[selected.observations.length - 1]?.day}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">预测 D180</div>
            <div className={`text-sm font-semibold ${
              pred.predictD180 >= 1.5 ? 'text-green-600' : 
              pred.predictD180 >= 1.0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {pred.confidence === 'actual' && selected.observations.some(o => o.day === 180)
                ? `${(selected.observations.find(o => o.day === 180).roi * 100).toFixed(1)}%`
                : `${(pred.predictD180 * 100).toFixed(1)}%`
              }
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center" title={`现金回本条件：\n净ROI × 平台分成(70%) = 1\n即净ROI ≥ ${(breakEvenROI * 100).toFixed(1)}%${localVatMode && avgVAT > 0 ? `\n\n考虑VAT ${(avgVAT * 100).toFixed(1)}%后：\n毛ROI需 ≥ ${((1 + avgVAT) / 0.70 * 100).toFixed(1)}%` : ''}`}>
            <div className="text-xs text-gray-500 mb-1">预测回本日</div>
            <div className={`text-sm font-semibold ${
              pred.breakEvenDay ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatBreakEven(pred.breakEvenDay)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {localVatMode && avgVAT > 0 ? (
                <span>
                  <span className="text-green-600">净ROI≥{(breakEvenROI * 100).toFixed(0)}%</span>
                  <span className="text-gray-500"> (毛≥{((1 + avgVAT) / 0.70 * 100).toFixed(0)}%)</span>
                </span>
              ) : (
                <span>ROI≥{(breakEvenROI * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">置信度</div>
            <div className="flex items-center justify-center gap-1">
              <ConfidenceBadge confidence={pred.confidence} />
              {pred.r2 > 0 && (
                <span className="text-xs text-gray-400">R²={((pred.r2) * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 全周预测汇总表 */}
      {validPredictions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">全周预测汇总</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">周</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">观测范围</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">D30 ROI</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">预测 D180</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">回本日</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">R²</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-600">置信度</th>
                </tr>
              </thead>
              <tbody>
                {[...validPredictions].reverse().map((p) => {
                  const isActual = p.prediction.confidence === 'actual'
                  const actualD180 = p.observations.find(o => o.day === 180)
                  return (
                    <tr
                      key={p.weekKey}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        p.weekKey === selected?.weekKey ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        const idx = predictions.findIndex(x => x.weekKey === p.weekKey)
                        if (idx >= 0) setSelectedWeekIdx(idx)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="py-2 px-3 font-medium">{p.weekKey}</td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        D{p.observations[0]?.day}~D{p.observations[p.observations.length - 1]?.day}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(() => {
                          const actualD30 = p.observations.find(o => o.day === 30)
                          if (actualD30) {
                            // 诊断信息：聚合行数
                            const weekRows = countryWeeklyData.find(w => w.weekKey === p.weekKey)
                            const rowCount = weekRows?.count || 0
                            return (
                              <span className="font-medium" title={`D30 ROI 来自 ${rowCount} 行数据聚合（消耗加权）`}>
                                {(actualD30.roi * 100).toFixed(1)}%*
                              </span>
                            )
                          }
                          const predD30 = p.prediction.predictAt?.(30)
                          if (predD30 > 0) return <span className="text-gray-500">{(predD30 * 100).toFixed(1)}%</span>
                          return <span className="text-gray-400">-</span>
                        })()}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${
                        p.prediction.predictD180 >= 1.5 ? 'text-green-600' :
                        p.prediction.predictD180 >= 1.0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {actualD180
                          ? `${(actualD180.roi * 100).toFixed(1)}%*`
                          : `${(p.prediction.predictD180 * 100).toFixed(1)}%`
                        }
                      </td>
                      <td className="py-2 px-3 text-right" title={`ROI达到${(breakEvenROI * 100).toFixed(1)}%的时间`}>
                        {formatBreakEven(p.prediction.breakEvenDay)}
                        {p.prediction.breakEvenDay && (
                          <div className="text-xs text-gray-400">
                            {localVatMode && avgVAT > 0 ? (
                              <span className="text-green-600">净≥{(breakEvenROI * 100).toFixed(0)}%</span>
                            ) : (
                              <span>≥{(breakEvenROI * 100).toFixed(0)}%</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-500">
                        {p.prediction.r2 > 0 ? `${(p.prediction.r2 * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <ConfidenceBadge confidence={p.prediction.confidence} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">* 实测 | 倍率：基于最近D30模型的长线倍率预估</p>
        </div>
      )}

      {/* 方法说明 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 mb-1.5">预测方法说明</h4>
        <ul className="text-xs text-gray-400 space-y-1 leading-relaxed">
          <li><span className="text-gray-500 font-medium">模型：</span>幂律函数 ROI(t) = a × t<sup>β</sup>，对数空间线性回归拟合</li>
          <li><span className="text-gray-500 font-medium">数据：</span>使用 D1~D30 每日 ROI + D36 起里程碑数据，单调性异常值剔除</li>
          <li><span className="text-gray-500 font-medium">全局参考：</span>汇集历史所有周数据（以 D30 归一化），拟合全局增长曲线作为外推基准</li>
          <li><span className="text-gray-500 font-medium">外推策略：</span>以当前周最远观测日为锚点，按全局模型曲线等比缩放预估长线 ROI</li>
          <li><span className="text-gray-500 font-medium">回本日：</span>现金回本线 = ROI ≥ {(breakEvenROI * 100).toFixed(1)}%（平台分成30%）{localVatMode && avgVAT > 0 ? `，数据已扣除VAT ${(avgVAT * 100).toFixed(1)}%` : ''}</li>
        </ul>
        <h4 className="text-xs font-semibold text-gray-500 mt-3 mb-1.5">数据清理规则</h4>
        <ul className="text-xs text-gray-400 space-y-1 leading-relaxed">
          <li><span className="text-gray-500 font-medium">时间完整性：</span>根据导出日期与数据日期计算可用天数，未跑满的里程碑不参与聚合</li>
          <li><span className="text-gray-500 font-medium">ROI 单调性：</span>ROI 为累积收入比，应单调递增；若 D(N) ROI &lt; D(N-1) ROI，视为异常剔除</li>
          <li><span className="text-gray-500 font-medium">留存单调性：</span>留存率应单调递减；若 D(N) 留存 &gt; D(N-1) 留存，视为异常剔除</li>
          <li><span className="text-gray-500 font-medium">零值过滤：</span>ROI 或留存率为 0 / 空值视为数据未跑满，对应里程碑剔除</li>
          <li><span className="text-gray-500 font-medium">拟合层二次清洗：</span>提取观测点时再次进行单调性校验，确保拟合数据严格合法</li>
        </ul>
      </div>
    </div>
  )
}

export default RoiPredictionCard
