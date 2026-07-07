import { useMemo } from 'react'
import { getVATRate } from '../../constants/vatRates'

function FilterBar({ filters, onChange, options, vatMode = false, onVatModeChange, data }) {
  // VAT 诊断：检测有效税率覆盖
  const vatDiag = useMemo(() => {
    if (!vatMode || !data) return null
    const countries = new Set()
    let matched = 0, unmatched = new Set()
    data.forEach(r => {
      if (r._isOrganic) return
      const c = r['国家']
      if (!c) return
      countries.add(c)
      if (getVATRate(c) > 0) matched++
      else unmatched.add(c)
    })
    return {
      totalCountries: countries.size,
      matchedCountries: [...countries].filter(c => getVATRate(c) > 0).length,
      unmatchedSamples: [...unmatched].slice(0, 5)
    }
  }, [vatMode, data])
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-gray-700">筛选条件：</span>
        
        {options.media && options.media.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">媒体:</label>
            <select
              value={filters.media}
              onChange={(e) => onChange({ ...filters, media: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {options.media.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        
        {options.appName && options.appName.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">产品:</label>
            <select
              value={filters.appName}
              onChange={(e) => onChange({ ...filters, appName: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {options.appName.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        
        {options.country && options.country.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">国家:</label>
            <select
              value={filters.country}
              onChange={(e) => onChange({ ...filters, country: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {options.country.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* VAT 扣除开关 */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={vatMode}
              onChange={(e) => onVatModeChange?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">扣除增值税</span>
          </label>
          {vatMode && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              净收入模式
            </span>
          )}
        </div>
        
        {/* VAT 诊断提示 */}
        {vatMode && vatDiag && vatDiag.totalCountries > 0 && vatDiag.matchedCountries === 0 && (
          <div className="w-full mt-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            ⚠️ 未匹配到增值税税率：检测到国家代码 [{vatDiag.unmatchedSamples.join(', ')}]，请确认是否为两位 ISO 代码（如 JP/KR/US）
          </div>
        )}
        {vatMode && vatDiag && vatDiag.matchedCountries > 0 && vatDiag.matchedCountries < vatDiag.totalCountries && (
          <div className="w-full mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            ℹ️ VAT 覆盖：{vatDiag.matchedCountries}/{vatDiag.totalCountries} 个国家匹配到税率{vatDiag.unmatchedSamples.length > 0 && `，未匹配: ${vatDiag.unmatchedSamples.join(', ')}`}
          </div>
        )}
        
        <button
          onClick={() => onChange({ media: '全部', appName: '全部', country: '全部' })}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          重置
        </button>
      </div>
    </div>
  )
}

export default FilterBar
