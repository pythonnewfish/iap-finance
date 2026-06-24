import { formatCurrency, formatNumber, formatPercent } from '../../constants/fieldMapping'

function ROITable({ products, weekLabel }) {
  if (!products || products.length === 0) {
    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">产品ROI里程碑</h3>
        <div className="text-center py-8 text-gray-500">
          暂无产品数据
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        产品ROI里程碑 <span className="text-sm font-normal text-gray-500">{weekLabel && `(${weekLabel})`}</span>
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-600">产品</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">新增用户</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">消耗</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D1 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D7 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D30 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D60 ROI</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">D90 ROI</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">综合评级</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                <td className="py-3 px-4 text-right">{formatNumber(product.newUsers)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(product.spend)}</td>
                <td className="py-3 px-4 text-right">
                  <ROIBadge value={product.roi_d1} benchmark={0.20} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ROIBadge value={product.roi_d7} benchmark={0.60} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ROIBadge value={product.roi_d30} benchmark={1.00} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ROIBadge value={product.roi_d60} benchmark={1.50} />
                </td>
                <td className="py-3 px-4 text-right">
                  <ROIBadge value={product.roi_d90} benchmark={2.00} />
                </td>
                <td className="py-3 px-4 text-center">
                  <GradeBadge grade={calculateGrade(product)} />
                </td>
              </tr>
            ))}
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

function GradeBadge({ grade }) {
  if (grade === '-') {
    return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-gray-100 text-gray-400">-</span>
  }
  
  const gradeConfig = {
    'A+': { bg: 'bg-green-500', text: 'text-white' },
    'A': { bg: 'bg-green-100', text: 'text-green-700' },
    'B': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'C': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'D': { bg: 'bg-red-100', text: 'text-red-700' }
  }
  
  const config = gradeConfig[grade] || gradeConfig['B']
  
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${config.bg} ${config.text}`}>
      {grade}
    </span>
  )
}

function calculateGrade(product) {
  // 必须有D90数据才能评级
  if (product.roi_d90 === null || product.roi_d90 === undefined) return '-'
  
  const d30 = product.roi_d30 || 0
  const d60 = product.roi_d60 || 0
  const d90 = product.roi_d90 || 0
  
  // 综合评分
  const score = d30 * 0.3 + d60 * 0.3 + d90 * 0.4
  
  if (score >= 2.0 && d90 >= 2.5) return 'A+'
  if (score >= 1.5 && d90 >= 2.0) return 'A'
  if (score >= 1.2 && d60 >= 1.5) return 'B'
  if (score >= 1.0) return 'C'
  return 'D'
}

export default ROITable
