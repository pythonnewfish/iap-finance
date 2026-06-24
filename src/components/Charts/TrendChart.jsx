import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatPercent } from '../../constants/fieldMapping'

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="暂无趋势数据" />
  }

  const chartData = data.map(item => ({
    name: item.weekKey,
    roi_d1: item.roi_d1 != null ? +(item.roi_d1 * 100).toFixed(1) : null,
    roi_d7: item.roi_d7 != null ? +(item.roi_d7 * 100).toFixed(1) : null,
    roi_d30: item.roi_d30 != null ? +(item.roi_d30 * 100).toFixed(1) : null,
    roi_d60: item.roi_d60 != null ? +(item.roi_d60 * 100).toFixed(1) : null,
    spend: item.spend ? Math.round(item.spend) : null,
    newUsers: item.newUsers ? Math.round(item.newUsers) : null
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
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
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (['roi_d1', 'roi_d7', 'roi_d30', 'roi_d60'].includes(name)) {
                const labels = { roi_d1: 'D1 ROI', roi_d7: 'D7 ROI', roi_d30: 'D30 ROI', roi_d60: 'D60 ROI' }
                return [`${value}%`, labels[name]]
              }
              return [value, name === 'spend' ? '消耗' : '新增用户']
            }}
            labelStyle={{ color: '#374151' }}
          />
          <Legend 
            formatter={(value) => {
              const labels = {
                roi_d1: 'D1 ROI',
                roi_d7: 'D7 ROI',
                roi_d30: 'D30 ROI',
                roi_d60: 'D60 ROI',
                spend: '消耗',
                newUsers: '新增用户'
              }
              return labels[value] || value
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="roi_d1" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            connectNulls
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="roi_d7" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="roi_d30" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 3 }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="roi_d60" 
            stroke="#ec4899" 
            strokeWidth={2}
            dot={{ fill: '#ec4899', r: 3 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="spend" 
            stroke="#f59e0b" 
            strokeWidth={2}
            strokeDasharray="5 5"
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

export default TrendChart
