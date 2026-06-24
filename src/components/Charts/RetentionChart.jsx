import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FIELD_MAPPING } from '../../constants/fieldMapping'
import { getISOWeek } from '../../services/parser'

function getFieldName(category, key) {
  return FIELD_MAPPING[category]?.[key] || key
}

// 核心留存里程碑
const RETENTION_MILESTONES = [
  { day: 1, label: 'D1留存', color: '#10b981' },
  { day: 7, label: 'D7留存', color: '#3b82f6' },
  { day: 14, label: 'D14留存', color: '#8b5cf6' },
  { day: 30, label: 'D30留存', color: '#f59e0b' },
  { day: 60, label: 'D60留存', color: '#ec4899' },
]

function RetentionChart({ data }) {
  const [retentionType, setRetentionType] = useState('retention')

  // 按周聚合核心留存率
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const weekMap = {}

    data.forEach(row => {
      const dateStr = row[getFieldName('dimensions', 'date')]
      if (!dateStr) return

      const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (!match) return

      const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
      const weekInfo = getISOWeek(date)
      const weekKey = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { weekKey, year: weekInfo.year, week: weekInfo.week, rows: [] }
      }
      weekMap[weekKey].rows.push(row)
    })

    // 计算每周的核心留存率
    const category = retentionType === 'paying' ? 'payingRetention' : 'retention'

    const result = Object.values(weekMap)
      .map(({ weekKey, year, week, rows }) => {
        const point = { weekKey }

        RETENTION_MILESTONES.forEach(({ day }) => {
          const fieldName = getFieldName(category, `d${day}`)
          const metaKey = `hasD${day}`

          let weightedSum = 0
          let totalWeight = 0

          rows.forEach(row => {
            // 只使用完整数据
            if (!row._meta?.[metaKey]) return

            const val = Number(row[fieldName])
            const weight = Number(row[getFieldName('acquisition', 'newUsers')]) || 0
            if (!isNaN(val) && weight > 0) {
              weightedSum += val * weight
              totalWeight += weight
            }
          })

          point[`d${day}`] = totalWeight > 0 ? (() => {
            const val = +(weightedSum / totalWeight * 100).toFixed(1)
            return val > 0 ? val : null // 留存率为0时剔除
          })() : null
        })

        return { ...point, year, week }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.week - b.week
      })

    return result
  }, [data, retentionType])

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        暂无留存数据
      </div>
    )
  }

  return (
    <div>
      {/* 类型切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setRetentionType('retention')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            retentionType === 'retention'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          留存率
        </button>
        <button
          onClick={() => setRetentionType('paying')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            retentionType === 'paying'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          付费留存率
        </button>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="weekKey"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(value, name) => {
                const milestone = RETENTION_MILESTONES.find(m => `d${m.day}` === name)
                return [`${value}%`, milestone?.label || name]
              }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Legend
              formatter={(value) => {
                const milestone = RETENTION_MILESTONES.find(m => `d${m.day}` === value)
                return milestone?.label || value
              }}
            />
            {RETENTION_MILESTONES.map(({ day, color }) => (
              <Line
                key={`d${day}`}
                type="monotone"
                dataKey={`d${day}`}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RetentionChart
