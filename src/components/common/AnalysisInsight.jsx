/**
 * 分析洞察组件
 * 显示标准分析模式的结果
 */

function AnalysisInsight({ analysis, compact = false }) {
  if (!analysis) return null

  const { title, summary, insights, trend, alerts } = analysis

  // 趋势图标
  const trendIcons = {
    '显著上升': '📈',
    '小幅上升': '↗️',
    '相对稳定': '➡️',
    '小幅下降': '↘️',
    '显著下降': '📉',
    '数据不足': '❓',
    '无': '⚪'
  }

  if (compact) {
    // 紧凑模式：只显示摘要
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-2">
          <span className="text-lg">{trendIcons[trend] || '📊'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium">{summary}</p>
            {alerts && alerts.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ {alerts[0]}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 完整模式
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{trendIcons[trend] || '📊'}</span>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      
      {/* 摘要 */}
      <p className="text-sm text-gray-700 font-medium mb-3">{summary}</p>
      
      {/* 关键洞察 */}
      {insights && insights.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">关键指标</p>
          <ul className="space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2 text-gray-400">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 预警 */}
      {alerts && alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">⚠️ 预警提示</p>
          <ul className="space-y-1">
            {alerts.map((alert, i) => (
              <li key={i} className="text-sm text-amber-700">
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AnalysisInsight
