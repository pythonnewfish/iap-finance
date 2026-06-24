import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency, formatPercent } from '../../constants/fieldMapping'

function ChannelCompare({ channels }) {
  if (!channels || channels.length === 0) {
    return <EmptyChart message="暂无渠道数据" />
  }

  const chartData = channels.slice(0, 10).map(channel => ({
    name: channel.name.length > 10 ? channel.name.slice(0, 10) + '...' : channel.name,
    fullName: channel.name,
    spend: channel.spend ? Math.round(channel.spend) : 0,
    newUsers: channel.newUsers ? Math.round(channel.newUsers) : 0,
    cpa: channel.cpa ? channel.cpa.toFixed(2) : '0.00',
    roi_d1: channel.roi_d1 ? (channel.roi_d1 * 100).toFixed(1) : '0.0',
    roi_d30: channel.roi_d30 ? (channel.roi_d30 * 100).toFixed(1) : null
  }))

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value, name) => {
              const labels = {
                spend: '消耗',
                newUsers: '新增用户',
                cpa: 'CPA',
                roi_d1: 'D1 ROI',
                roi_d30: 'D30 ROI'
              }
              if (name === 'roi_d1' || name === 'roi_d30') {
                return [`${value}%`, labels[name] || name]
              }
              return [value, labels[name] || name]
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullName || label
              }
              return label
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="spend" name="消耗" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="newUsers" name="新增用户" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="roi_d1" name="D1 ROI" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-96 flex items-center justify-center text-gray-400">
      {message}
    </div>
  )
}

export default ChannelCompare
