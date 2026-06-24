import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// LTV里程碑
const LTV_MILESTONES = [
  { day: 1, label: 'LTV D1', color: '#10b981' },
  { day: 7, label: 'LTV D7', color: '#3b82f6' },
  { day: 14, label: 'LTV D14', color: '#8b5cf6' },
  { day: 30, label: 'LTV D30', color: '#f59e0b' },
  { day: 60, label: 'LTV D60', color: '#ec4899' },
]

function LtvChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="暂无LTV数据" />
  }

  const chartData = data.map(item => {
    const point = { weekKey: item.weekKey }

    LTV_MILESTONES.forEach(({ day }) => {
      const key = `ltv_d${day}`
      if (item[key] !== null && item[key] !== undefined) {
        point[`d${day}`] = +item[key].toFixed(2)
      }
    })

    return point
  })

  return (
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
            tickFormatter={(value) => `$${value}`}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value, name) => {
              const milestone = LTV_MILESTONES.find(m => `d${m.day}` === name)
              return [`$${value}`, milestone?.label || name]
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value) => {
              const milestone = LTV_MILESTONES.find(m => `d${m.day}` === value)
              return milestone?.label || value
            }}
          />
          {LTV_MILESTONES.map(({ day, color }) => (
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
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-80 flex items-center justify-center text-gray-400">
      {message}
    </div>
  )
}

export default LtvChart
