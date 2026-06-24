import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../constants/fieldMapping'

function CpaArpuChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="暂无数据" />
  }

  const chartData = data.map(item => ({
    weekKey: item.weekKey,
    cpa: item.cpa ? +item.cpa.toFixed(2) : null,
    arpu: item.avgArpudau ? +item.avgArpudau.toFixed(4) : null,
    newUsers: item.newUsers ? Math.round(item.newUsers) : null,
    spend: item.spend ? Math.round(item.spend) : null
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
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value, name) => {
              const labels = {
                cpa: 'CPA',
                arpu: 'DAU ARPU'
              }
              return [`$${value}`, labels[name] || name]
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value) => {
              const labels = { cpa: 'CPA', arpu: 'DAU ARPU' }
              return labels[value] || value
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cpa"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="arpu"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
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

export default CpaArpuChart
