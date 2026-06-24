function FilterBar({ filters, onChange, options }) {
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
