import { formatCurrency, formatNumber, formatPercent } from '../../constants/fieldMapping'

function CountryAnalysis({ data, weekLabel }) {
  // 过滤掉无投放的国家
  const validData = (data || []).filter(c => c.spend && c.spend > 0)
  
  if (validData.length === 0) {
    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">国家投放分析</h3>
        <div className="text-center py-8 text-gray-500">暂无数据</div>
      </div>
    )
  }

  // 计算汇总
  const totalNewUsers = validData.reduce((s, c) => s + (c.newUsers || 0), 0)
  const totalSpend = validData.reduce((s, c) => s + (c.spend || 0), 0)

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        国家投放分析 <span className="text-sm font-normal text-gray-500">{weekLabel && `(${weekLabel})`}</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-600">国家</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">新增用户</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">占比</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">消耗</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">CPA</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D1 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D7 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D30 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D1 留存</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D7 留存</th>
            </tr>
          </thead>
          <tbody>
            {validData.map((country, index) => {
              const userShare = totalNewUsers > 0 ? country.newUsers / totalNewUsers : 0
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{country.name}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(country.newUsers)}</td>
                  <td className="py-3 px-4 text-right text-gray-500">{(userShare * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(country.spend)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(country.cpa)}</td>
                  <td className="py-3 px-4 text-right">
                    <ROIBadge value={country.roi_d1} benchmark={0.20} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ROIBadge value={country.roi_d7} benchmark={0.60} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ROIBadge value={country.roi_d30} benchmark={1.00} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <RetentionBadge value={country.retention_d1} benchmark={0.40} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <RetentionBadge value={country.retention_d7} benchmark={0.20} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ROIBadge({ value, benchmark }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>
  }
  const isGood = value >= benchmark
  const isWarning = value >= benchmark * 0.8 && value < benchmark

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isGood ? 'bg-green-100 text-green-700' :
      isWarning ? 'bg-amber-100 text-amber-700' :
      'bg-red-100 text-red-700'
    }`}>
      {formatPercent(value)}
    </span>
  )
}

function RetentionBadge({ value, benchmark }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>
  }
  const isGood = value >= benchmark
  const isWarning = value >= benchmark * 0.8 && value < benchmark

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isGood ? 'bg-green-100 text-green-700' :
      isWarning ? 'bg-amber-100 text-amber-700' :
      'bg-red-100 text-red-700'
    }`}>
      {formatPercent(value)}
    </span>
  )
}

export default CountryAnalysis
