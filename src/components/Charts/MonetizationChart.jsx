import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function MonetizationChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="暂无数据" />
  }

  const chartData = data.map(item => ({
    weekKey: item.weekKey,
    payingRate: item.avgPayingRate != null ? +(item.avgPayingRate * 100).toFixed(2) : null,
    arppu: item.avgArppu != null ? +item.avgArppu.toFixed(2) : null
  }))

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
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'payingRate') return [`${value}%`, '付费率']
              if (name === 'arppu') return [`$${value}`, '付费ARPPU']
              return [value, name]
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value) => {
              const labels = { payingRate: '付费率', arppu: '付费ARPPU' }
              return labels[value] || value
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="payingRate"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="arppu"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
            connectNulls
          />
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

export default MonetizationChart
