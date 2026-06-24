import { useMemo } from 'react'
import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts'

const BREAK_EVEN_ROI = 1.5

function RoiPredictionChart({ observations, prediction }) {
  const chartData = useMemo(() => {
    if (!prediction || prediction.confidence === 'none' || !observations?.length) {
      return { obsPoints: [], fitLine: [], extrapLine: [] }
    }

    // 观测点
    const obsPoints = observations.map(o => ({
      day: o.day,
      observed: o.roi * 100  // 转为百分比显示
    }))

    // 拟合曲线数据
    const maxObsDay = Math.max(...observations.map(o => o.day))
    const maxDay = Math.min(360, Math.max(180, maxObsDay * 1.5))

    const fitLine = []
    for (let d = 1; d <= maxObsDay; d += (d < 30 ? 1 : d < 90 ? 3 : 7)) {
      const roi = prediction.predictAt(d)
      if (roi !== null && roi > 0) {
        fitLine.push({ day: d, fitted: roi * 100 })
      }
    }
    // 确保包含最大观测点
    const lastObsRoi = prediction.predictAt(maxObsDay)
    if (lastObsRoi > 0) {
      fitLine.push({ day: maxObsDay, fitted: lastObsRoi * 100 })
    }

    // 外推曲线数据
    const extrapLine = []
    for (let d = maxObsDay; d <= maxDay; d += (d < 90 ? 3 : 7)) {
      const roi = prediction.predictAt(d)
      if (roi !== null && roi > 0) {
        extrapLine.push({ day: d, extrapolated: roi * 100 })
      }
    }
    // 确保包含终点
    const endRoi = prediction.predictAt(maxDay)
    if (endRoi > 0) {
      extrapLine.push({ day: maxDay, extrapolated: endRoi * 100 })
    }

    return { obsPoints, fitLine, extrapLine, maxDay }
  }, [observations, prediction])

  if (!chartData.obsPoints.length || prediction?.confidence === 'none') {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        数据不足，无法生成预测曲线
      </div>
    )
  }

  const { obsPoints, fitLine, extrapLine, maxDay } = chartData
  const breakEvenDay = prediction?.breakEvenDay
  const breakEvenPct = BREAK_EVEN_ROI * 100

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, maxDay || 180]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `D${v}`}
            ticks={[1, 7, 14, 30, 60, 90, 120, 150, 180].filter(d => d <= (maxDay || 180))}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value, name) => {
              const labels = { observed: '观测值', fitted: '拟合曲线', extrapolated: '外推预测' }
              return [`${value.toFixed(1)}%`, labels[name] || name]
            }}
            labelFormatter={(v) => `第 ${v} 天`}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value) => {
              const labels = { observed: '观测数据', fitted: '拟合曲线', extrapolated: '外推预测' }
              return labels[value] || value
            }}
          />

          {/* 回本线 */}
          <ReferenceLine
            y={breakEvenPct}
            stroke="#ef4444"
            strokeDasharray="5 3"
            label={{ value: '回本线 150%', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />

          {/* 回本日竖线 */}
          {breakEvenDay && breakEvenDay <= (maxDay || 180) && (
            <ReferenceLine
              x={breakEvenDay}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: `D${breakEvenDay}`, position: 'top', fill: '#f59e0b', fontSize: 11 }}
            />
          )}

          {/* 拟合曲线（已观测区间） */}
          <Line
            data={fitLine}
            dataKey="fitted"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {/* 外推曲线（未观测区间，虚线） */}
          <Line
            data={extrapLine}
            dataKey="extrapolated"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />

          {/* 观测点 */}
          <Scatter
            data={obsPoints}
            dataKey="observed"
            fill="#3b82f6"
            stroke="#1e40af"
            r={5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RoiPredictionChart
