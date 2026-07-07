import { useState, useMemo } from 'react'
import { getVATRate } from '../../constants/vatRates'
import { predictAllWeeks } from '../../services/roiPredictor'
import { aggregateByWeek } from '../../services/aggregator'

const PLATFORM_CUT = 0.70
const TARGET_DAYS = [240, 270, 300, 360]

/**
 * ROI 回本目标表
 * 支持独立筛选β数据源（媒体/产品），以及独立选择显示国家
 */
function BreakEvenTargetTable({ data, hasCountryField, hasMediaField }) {
  // β 数据源筛选
  const [betaMedia, setBetaMedia] = useState('全部')
  const [betaProduct, setBetaProduct] = useState('全部')
  const [betaCountry, setBetaCountry] = useState('全部')
  // 表格显示国家筛选
  const [selectedCountries, setSelectedCountries] = useState(new Set()) // 空=全部

  // 获取媒体/产品选项
  const mediaOptions = useMemo(() => {
    if (!data || !hasMediaField) return []
    const medias = new Set()
    data.forEach(r => {
      if (r._isOrganic) return
      const m = r['媒体']
      if (m) medias.add(m)
    })
    return ['全部', ...Array.from(medias).sort()]
  }, [data, hasMediaField])

  const productOptions = useMemo(() => {
    if (!data) return []
    const products = new Set()
    data.forEach(r => {
      if (r._isOrganic) return
      const p = r['应用名称']
      if (p) products.add(p)
    })
    return ['全部', ...Array.from(products).sort()]
  }, [data])

  // β 数据源的国家选项（按消耗降序）
  const betaCountryOptions = useMemo(() => {
    if (!data || !hasCountryField) return []
    const spendByCountry = {}
    data.forEach(r => {
      if (r._isOrganic) return
      const country = r['国家']
      if (!country) return
      const spend = Number(r['消耗($)']) || 0
      spendByCountry[country] = (spendByCountry[country] || 0) + spend
    })
    const sorted = Object.entries(spendByCountry)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)
    return ['全部', ...sorted]
  }, [data, hasCountryField])

  // β 数据源筛选后的数据
  const betaSourceData = useMemo(() => {
    if (!data) return data
    let filtered = data
    if (betaMedia !== '全部' && hasMediaField) {
      filtered = filtered.filter(r => r['媒体'] === betaMedia)
    }
    if (betaProduct !== '全部') {
      filtered = filtered.filter(r => r['应用名称'] === betaProduct)
    }
    if (betaCountry !== '全部' && hasCountryField) {
      filtered = filtered.filter(r => r['国家'] === betaCountry)
    }
    return filtered
  }, [data, betaMedia, betaProduct, betaCountry, hasMediaField, hasCountryField])

  // 计算 β：基于筛选后的数据
  const computedBeta = useMemo(() => {
    if (!betaSourceData || betaSourceData.length === 0) return null
    const weeklyData = aggregateByWeek(betaSourceData)
    if (weeklyData.length === 0) return null
    const predictions = predictAllWeeks(weeklyData)
    const withBeta = predictions.find(p => p.prediction?.beta > 0)
    return withBeta?.prediction?.beta || null
  }, [betaSourceData])

  // 所有国家选项（按消耗降序）
  const countryOptions = useMemo(() => {
    if (!data || !hasCountryField) return []
    const spendByCountry = {}
    data.forEach(r => {
      if (r._isOrganic) return
      const country = r['国家']
      if (!country) return
      const spend = Number(r['消耗($)']) || 0
      spendByCountry[country] = (spendByCountry[country] || 0) + spend
    })
    return Object.entries(spendByCountry)
      .sort((a, b) => b[1] - a[1])
      .map(([country, spend]) => ({ country, spend }))
  }, [data, hasCountryField])

  // 表格显示的数据（按国家筛选）
  const tableDisplayData = useMemo(() => {
    if (!data || selectedCountries.size === 0) return data // 空=全部
    return data.filter(r => selectedCountries.has(r['国家']))
  }, [data, selectedCountries])

  const tableData = useMemo(() => {
    if (!tableDisplayData || !hasCountryField || !computedBeta || computedBeta <= 0) return []
    
    // 找出最近一周
    const weeks = new Set()
    tableDisplayData.forEach(r => {
      const wk = r['周']
      if (wk) weeks.add(wk)
    })
    const sortedWeeks = Array.from(weeks).sort()
    const latestWeek = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : null
    
    // 按国家汇总总消耗和最近一周消耗
    const spendByCountry = {}
    const recentSpendByCountry = {}
    tableDisplayData.forEach(r => {
      if (r._isOrganic) return
      const country = r['国家']
      if (!country) return
      const spend = Number(r['消耗($)']) || 0
      spendByCountry[country] = (spendByCountry[country] || 0) + spend
      if (latestWeek && r['周'] === latestWeek) {
        recentSpendByCountry[country] = (recentSpendByCountry[country] || 0) + spend
      }
    })
    
    // 按消耗降序排列
    const countries = Object.entries(spendByCountry)
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country)
    
    return countries.map(country => {
      const vatRate = getVATRate(country)
      const breakEvenGross = (1 + vatRate) / PLATFORM_CUT
      
      // 计算该国自己的 β，同样按产品/媒体筛选
      let countryData = tableDisplayData.filter(r => r['国家'] === country)
      if (betaMedia !== '全部' && hasMediaField) {
        countryData = countryData.filter(r => r['媒体'] === betaMedia)
      }
      if (betaProduct !== '全部') {
        countryData = countryData.filter(r => r['应用名称'] === betaProduct)
      }
      let countryBeta = null
      if (countryData.length > 0) {
        const countryWeekly = aggregateByWeek(countryData)
        if (countryWeekly.length > 0) {
          const countryPredictions = predictAllWeeks(countryWeekly)
          const withBeta = countryPredictions.find(p => p.prediction?.beta > 0)
          countryBeta = withBeta?.prediction?.beta || null
        }
      }
      
      // 使用该国自己的 β 计算回本目标，若无则回退到数据源 β
      const effectiveBeta = countryBeta || computedBeta
      
      const targets = TARGET_DAYS.map(day => {
        const requiredD30 = breakEvenGross * Math.pow(30 / day, effectiveBeta)
        return { day, requiredD30 }
      })
      
      return {
        country,
        vatRate,
        breakEvenGross,
        spend: spendByCountry[country],
        recentSpend: recentSpendByCountry[country] || 0,
        countryBeta,
        targets
      }
    })
  }, [tableDisplayData, hasCountryField, computedBeta, betaMedia, betaProduct, hasMediaField])

  const toggleCountry = (country) => {
    const next = new Set(selectedCountries)
    if (next.has(country)) {
      next.delete(country)
    } else {
      next.add(country)
    }
    setSelectedCountries(next)
  }

  const selectAllCountries = () => setSelectedCountries(new Set())

  if (!data || !hasCountryField || !computedBeta || computedBeta <= 0) return null
  
  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        各国 D30 ROI 回本目标
      </h3>

      {/* β 数据源筛选 */}
      <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">β 数据源：</span>
          <span className="text-sm font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
            β = {computedBeta?.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {hasMediaField && mediaOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">媒体：</label>
              <select
                value={betaMedia}
                onChange={(e) => setBetaMedia(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-gray-200 bg-white"
              >
                {mediaOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          {productOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">产品：</label>
              <select
                value={betaProduct}
                onChange={(e) => setBetaProduct(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-gray-200 bg-white"
              >
                {productOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          {hasCountryField && betaCountryOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">国家：</label>
              <select
                value={betaCountry}
                onChange={(e) => setBetaCountry(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-gray-200 bg-white"
              >
                {betaCountryOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 表格显示国家筛选 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">显示国家：</span>
          <button
            onClick={selectAllCountries}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selectedCountries.size === 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          <div className="flex flex-wrap gap-1">
            {countryOptions.slice(0, 15).map(({ country, spend }) => (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedCountries.size === 0 || selectedCountries.has(country)
                    ? selectedCountries.size === 0
                      ? 'bg-gray-50 border-gray-200 text-gray-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
                title={`${country}: $${Math.round(spend).toLocaleString()}`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">国家</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">最近周消耗</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">总消耗</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">VAT</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">各国β</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">回本阈值</th>
              {TARGET_DAYS.map(day => (
                <th key={day} className="text-right py-2 px-3 text-xs font-medium text-gray-600">
                  D{day}回本
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr
                key={row.country}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}
              >
                <td className="py-2 px-3 font-medium">
                  {row.country}
                </td>
                <td className="py-2 px-3 text-right text-gray-700 font-medium">
                  ${Math.round(row.recentSpend).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-gray-500 text-xs">
                  ${Math.round(row.spend).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {(row.vatRate * 100).toFixed(0)}%
                </td>
                <td className="py-2 px-3 text-right">
                  {row.countryBeta ? (
                    <span className="text-xs font-mono text-purple-600">
                      {row.countryBeta.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {(row.breakEvenGross * 100).toFixed(1)}%
                </td>
                {row.targets.map(t => (
                  <td key={t.day} className="py-2 px-3 text-right font-medium">
                    <span className={t.requiredD30 > 1.0 ? 'text-red-600' : 'text-green-600'}>
                      {(t.requiredD30 * 100).toFixed(1)}%
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 说明 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 mb-1.5">计算说明</h4>
        <ul className="text-xs text-gray-400 space-y-1 leading-relaxed">
          <li><span className="text-gray-500 font-medium">回本阈值：</span>毛ROI = (1 + VAT税率) / 0.70，即扣除平台分成30%和增值税后现金回本</li>
          <li><span className="text-gray-500 font-medium">D30 目标：</span>使用各国自己的 β 计算，公式：回本阈值 × (30/Dn)^β</li>
          <li><span className="text-gray-500 font-medium">各国β：</span>紫色数字为该国自己的增长速率，若无数据则回退到数据源 β</li>
          <li><span className="text-gray-500 font-medium">颜色含义：</span><span className="text-green-600">绿色</span>表示目标 ROI ≤ 100%（较易达成），<span className="text-red-600">红色</span>表示目标 ROI &gt; 100%（需较高首日表现）</li>
        </ul>
      </div>
    </div>
  )
}

export default BreakEvenTargetTable
