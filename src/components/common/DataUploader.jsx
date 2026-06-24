import { useState, useRef } from 'react'
import { parseExcelFile } from '../../services/parser'
import { cleanData } from '../../services/cleaner'

function DataUploader({ onDataLoaded }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsLoading(true)
    setFileName(file.name)
    setDebugInfo(null)

    try {
      // 解析Excel
      const parsed = await parseExcelFile(file)
      
      // 调试信息
      setDebugInfo({
        fileName: file.name,
        exportDate: parsed.exportDate,
        totalRows: parsed.data.length,
        headers: parsed.headers.slice(0, 10), // 前10个字段
        sampleRow: parsed.data[0]
      })
      
      if (!parsed.exportDate) {
        throw new Error('无法从文件名解析导出日期，请确保文件名格式为：广告ROI报表-海外iap20260615110839.xlsx')
      }

      // 清洗数据
      const cleaned = cleanData(parsed.data, parsed.exportDate)
      
      // 传递给父组件
      onDataLoaded({
        ...cleaned,
        headers: parsed.headers,
        exportDate: parsed.exportDate,
        fileName: file.name,
        hasMediaField: parsed.hasMediaField,
        hasCountryField: parsed.hasCountryField
      })
    } catch (err) {
      setError(err.message)
      setFileName('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      const dt = new DataTransfer()
      dt.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
      }
    } else {
      setError('请上传Excel文件（.xlsx 或 .xls）')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div 
        className={`card border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-400'} transition-colors cursor-pointer`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="text-center py-8">
          {isLoading ? (
            <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isLoading ? '正在解析数据...' : '上传数据文件'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            {isLoading ? '请稍候' : '拖拽文件到此处，或点击选择文件'}
          </p>
          
          <p className="text-sm text-gray-400">
            支持格式：.xlsx, .xls
          </p>
          
          {fileName && (
            <div className="mt-4 px-4 py-2 bg-gray-100 rounded-lg inline-block">
              <span className="text-sm text-gray-600">{fileName}</span>
            </div>
          )}
          
          {error && (
            <div className="mt-4 px-4 py-2 bg-red-100 rounded-lg inline-block">
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* 调试信息显示 */}
      {debugInfo && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">数据解析调试信息</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>文件名:</strong> {debugInfo.fileName}</p>
            <p><strong>解析的导出日期:</strong> {debugInfo.exportDate?.toString() || '解析失败'}</p>
            <p><strong>数据行数:</strong> {debugInfo.totalRows}</p>
            <p><strong>前10个字段:</strong> {debugInfo.headers?.join(', ')}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-primary-600">查看第一行数据示例</summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(debugInfo.sampleRow, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">文件名格式要求</h4>
        <p className="text-sm text-blue-700 font-mono">
          广告ROI报表-海外iap20260615110839.xlsx
        </p>
        <p className="text-xs text-blue-600 mt-2">
          其中 20260615110839 表示导出日期（年月日时分秒），系统将根据此日期自动剔除不完整的N日数据
        </p>
      </div>
    </div>
  )
}

export default DataUploader
