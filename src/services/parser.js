import * as XLSX from 'xlsx'

/**
 * 从文件名解析导出日期
 * 文件名格式: 广告ROI报表-海外iap20260615110839.xlsx
 * @param {string} filename - 文件名
 * @returns {Date|null} 导出日期
 */
export function parseExportDate(filename) {
  const match = filename.match(/(\d{14})\.xlsx?$/)
  if (!match) return null
  
  const dateStr = match[1] // "20260615110839"
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  
  return new Date(`${year}-${month}-${day}`)
}

/**
 * 解析数据表中的日期字段
 * 支持格式:
 *   - "2026-06-14(星期日)" 文本格式
 *   - "2026-06-14" 文本格式
 *   - 45853 Excel序列号数字
 *   - Date对象
 * @param {*} dateVal - 日期值（可能是字符串或数字）
 * @returns {Date|null}
 */
export function parseDataDate(dateVal) {
  if (dateVal === null || dateVal === undefined || dateVal === '') return null
  
  // 已经是Date对象
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal
  }
  
  // 处理Excel日期序列号（数字）
  // Excel基准日期：1900-01-01 对应序号1，但有1900-02-29闰年bug
  if (typeof dateVal === 'number' && dateVal > 1000 && dateVal < 200000) {
    // 使用SheetJS的算法：序号 - 25569 天 = UTC 1970-01-01基准
    const utcDays = dateVal - 25569
    const date = new Date(utcDays * 86400000)
    return isNaN(date.getTime()) ? null : date
  }
  
  const dateStr = String(dateVal)
  
  // 处理 "2026-06-14(星期日)" 格式
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}`)
  }
  
  // 尝试直接解析
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

/**
 * 计算两个日期之间的天数差
 * @param {Date} date1 - 较晚的日期（导出日期）
 * @param {Date} date2 - 较早的日期（数据日期）
 * @returns {number} 天数差
 */
export function getDaysDiff(date1, date2) {
  if (!date1 || !date2) return 0
  
  const diffTime = date1.getTime() - date2.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * 获取自然周的起止日期（周一到周日）
 * @param {Date} date - 周内任意日期
 * @returns {{ start: Date, end: Date }}
 */
export function getWeekRange(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整为周一
  
  const start = new Date(d)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * 获取ISO周数
 * @param {Date} date
 * @returns {{ year: number, week: number }}
 */
export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNum }
}

/**
 * 解析Excel文件
 * @param {File} file - 文件对象
 * @returns {Promise<{ data: Array, headers: Array, exportDate: Date }>}
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const fileBuffer = new Uint8Array(e.target.result)
        const workbook = XLSX.read(fileBuffer, { type: 'array' })
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // 解析为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          reject(new Error('Excel文件数据行数不足'))
          return
        }
        
        // 自动查找表头行：查找包含"日期"字段且列数较多的行
        let headerRowIdx = -1
        for (let r = 0; r < Math.min(20, jsonData.length); r++) {
          const row = jsonData[r]
          if (!row || row.length < 5) continue
          const hasDate = row.some(cell => String(cell).trim() === '日期')
          if (hasDate) {
            headerRowIdx = r
            break
          }
        }
        
        if (headerRowIdx < 0) {
          // 回退：用第0行或第1行作为表头
          headerRowIdx = jsonData[0].length > 5 ? 0 : 1
        }
        
        // 提取表头和数据行
        // 表头清理：去除首尾空格，并修复内部多余空格（如 "24 日留存" -> "24日留存"）
        const headers = jsonData[headerRowIdx].map(h => {
          let s = String(h).trim()
          // 修复数字与"日"之间的空格
          s = s.replace(/(\d)\s+(日)/g, '$1$2')
          return s
        })
        // 其余为数据行（跳过表头后的行）
        const rows = jsonData.slice(headerRowIdx + 1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
        
        // 判断字段是否为日期类型（根据表头名称或值特征）
        const isDateColumn = (header) => {
          return header === '日期'
        }
        
        // 将行数据转换为对象，并转换文本数字为真正数字
        const data = rows.map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            let value = row[index]
            
            // 日期列保持原样，不做数字转换
            if (isDateColumn(header)) {
              obj[header] = value
              return
            }
            
            // 转换文本数字为真正的数字
            if (typeof value === 'string') {
              // 移除百分号并转换为小数
              if (value.includes('%')) {
                const num = parseFloat(value.replace('%', '').replace(',', ''))
                value = isNaN(num) ? value : num / 100
              }
              // 尝试转换为数字（排除日期格式的字符串）
              else if (!/^\d{4}[-/]\d{1,2}/.test(value)) {
                const num = parseFloat(value.replace(',', ''))
                if (!isNaN(num) && value.trim() !== '') {
                  value = num
                }
              }
            }
            obj[header] = value
          })
          return obj
        })
        
        // 检查可选字段是否存在
        const hasMediaField = headers.includes('媒体')
        const hasCountryField = headers.includes('国家')
        
        // 标记自然量数据（仅当媒体字段存在时）
        data.forEach(row => {
          if (!hasMediaField) {
            // 无媒体字段时，所有数据视为付费数据
            row._isOrganic = false
          } else {
            const media = row['媒体']
            const mediaStr = media !== undefined && media !== null ? String(media).trim() : ''
            row._isOrganic = (mediaStr === '自然量' || mediaStr === '')
          }
        })
        
        // 从文件名解析导出日期
        const exportDate = parseExportDate(file.name)
        
        resolve({
          data,
          headers,
          exportDate,
          totalRows: data.length,
          hasMediaField,
          hasCountryField
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

export default {
  parseExportDate,
  parseDataDate,
  getDaysDiff,
  getWeekRange,
  getISOWeek,
  parseExcelFile
}
