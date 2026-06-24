function IntegrityReport({ report, exportDate }) {
  if (!report) return null

  const milestones = [1, 7, 14, 21, 30, 42, 60, 75, 90, 120, 180]

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">数据完整性报告</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{report.total}</div>
          <div className="text-sm text-gray-500">总记录数</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{report.byMilestone[90]?.complete || 0}</div>
          <div className="text-sm text-gray-500">有D90数据的记录</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{report.removedCount || 0}</div>
          <div className="text-sm text-gray-500">被剔除的记录</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          数据导出日期：{exportDate?.toLocaleDateString('zh-CN')}
        </div>
        {report.dateRange && (
          <div className="text-sm text-gray-500 mb-2">
            数据日期范围：{report.dateRange.min?.toLocaleDateString('zh-CN')} ~ {report.dateRange.max?.toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">里程碑</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">完整记录数</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">完整率</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">覆盖率</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(day => {
              const complete = report.byMilestone[day]?.complete || 0
              const incomplete = report.byMilestone[day]?.incomplete || 0
              const total = complete + incomplete
              const rate = total > 0 ? (complete / total * 100).toFixed(1) : 0
              
              return (
                <tr key={day} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium">D{day}</td>
                  <td className="py-2 px-3 text-right text-green-600 font-medium">{complete}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rate >= 80 ? 'bg-green-100 text-green-700' :
                      rate >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {rate}%
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rate >= 80 ? 'bg-green-500' :
                          rate >= 50 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IntegrityReport
