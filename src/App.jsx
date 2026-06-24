import { useState } from 'react'
import DataUploader from './components/common/DataUploader'
import Dashboard from './components/Dashboard/Dashboard'

function App() {
  const [cleanedData, setCleanedData] = useState(null)
  const [exportDate, setExportDate] = useState(null)

  const handleDataLoaded = (parsedData) => {
    setCleanedData(parsedData)
    setExportDate(parsedData.exportDate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IAP游戏买量财务分析</h1>
              <p className="text-sm text-gray-500 mt-1">
                数据导出日期: {exportDate ? exportDate.toLocaleDateString('zh-CN') : '未选择文件'}
              </p>
            </div>
            {cleanedData && (
              <button 
                onClick={() => { setCleanedData(null); setExportDate(null) }}
                className="btn-secondary text-sm"
              >
                重新上传
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!cleanedData ? (
          <DataUploader onDataLoaded={handleDataLoaded} />
        ) : (
          <Dashboard 
            data={cleanedData.data} 
            report={cleanedData.report} 
            exportDate={exportDate}
            hasMediaField={cleanedData.hasMediaField}
            hasCountryField={cleanedData.hasCountryField}
          />
        )}
      </main>
    </div>
  )
}

export default App
