import { formatCurrency, formatNumber, formatPercent } from '../../constants/fieldMapping'

function SummaryCards({ data, productData, exportDate }) {
  // 本周数据来自 getCurrentWeekData，已剔除非完整里程碑数据
  const weekData = data || {}
  
  const totalNewUsers = weekData.newUsers || 0
  const totalSpend = weekData.spend || 0
  const avgCpa = weekData.cpa || 0
  const d1Roi = weekData.roi_d1
  const d7Roi = weekData.roi_d7
  const d30Roi = weekData.roi_d30
  
  // 获取本周区间（导出日期往前推一周）
  const weekRangeLabel = data?.weekRange || (() => {
    if (!exportDate) return ''
    const d = new Date(exportDate)
    d.setDate(d.getDate() - 7)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(d)
    start.setDate(diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('zh-CN')} ~ ${end.toLocaleDateString('zh-CN')}`
  })()

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        本周概览 <span className="text-sm font-normal text-gray-500">({weekRangeLabel})</span>
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="本周新增"
          value={formatNumber(totalNewUsers)}
          color="blue"
        />
        <StatCard
          label="本周消耗"
          value={formatCurrency(totalSpend)}
          color="gray"
        />
        <StatCard
          label="平均CPA"
          value={formatCurrency(avgCpa)}
          color="amber"
        />
        <StatCard
          label="D1 ROI"
          value={d1Roi !== null && d1Roi !== undefined ? formatPercent(d1Roi) : '--'}
          color={d1Roi >= 0.20 ? 'green' : 'red'}
          badge={d1Roi !== null && d1Roi !== undefined ? (d1Roi >= 0.20 ? '达标' : '未达标') : '数据未完整'}
        />
        <StatCard
          label="D7 ROI"
          value={d7Roi !== null && d7Roi !== undefined ? formatPercent(d7Roi) : '--'}
          color={d7Roi >= 0.40 ? 'green' : d7Roi !== null ? 'red' : 'gray'}
          badge={d7Roi === null ? '数据未完整' : undefined}
        />
        <StatCard
          label="D30 ROI"
          value={d30Roi !== null && d30Roi !== undefined ? formatPercent(d30Roi) : '--'}
          color={d30Roi >= 1.00 ? 'green' : d30Roi >= 0.80 ? 'amber' : d30Roi !== null ? 'red' : 'gray'}
          badge={d30Roi === null ? '数据未完整' : undefined}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, badge }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-50 text-gray-700'
  }
  
  return (
    <div className="card">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClasses[color].split(' ')[1]}`}>{value}</div>
      {badge && (
        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${colorClasses[color]}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default SummaryCards
