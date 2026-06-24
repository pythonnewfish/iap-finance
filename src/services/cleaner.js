import { parseDataDate, getDaysDiff } from './parser'

/**
 * 数据清洗模块
 * 核心逻辑：根据导出日期，计算每行数据的最大可用天数
 * 剔除N日ROI/LTV/留存等不完整的数据
 */

// 所有可用里程碑天数（D1-D30每日 + 后续里程碑）
export const MILESTONE_DAYS = [
  ...Array.from({ length: 30 }, (_, i) => i + 1),  // D1~D30
  36, 42, 48, 54, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360
]

// 字段名称映射 - ROI字段（D1-D30每日 + 后续里程碑）
const roiFieldMap = {}
roiFieldMap[1] = '首日ROI'
for (let d = 2; d <= 30; d++) roiFieldMap[d] = `${d}日ROI`
;[36,42,48,54,60,75,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345,360].forEach(d => {
  roiFieldMap[d] = `${d}日ROI`
})
export const ROI_FIELDS = roiFieldMap

// 字段名称映射 - LTV字段
export const LTV_FIELDS = {
  1: '新增 arpu',
  2: 'LTV2',
  3: 'LTV3',
  4: 'LTV4',
  5: 'LTV5',
  6: 'LTV6',
  7: 'LTV7',
  14: 'LTV14',
  21: 'LTV21',
  30: 'LTV30',
  42: 'LTV42',
  60: 'LTV60',
  90: 'LTV90',
  120: 'LTV120',
  180: 'LTV180',
  270: 'LTV270',
  360: 'LTV360'
}

// 字段名称映射 - 留存字段（包含月度）
export const RETENTION_FIELDS = {
  1: '1日留存',
  7: '7日留存',
  14: '14日留存',
  21: '21日留存',
  30: '30日留存',
  42: '42日留存',
  60: '60日留存',
  75: '75日留存',
  90: '90日留存',
  105: '105日留存',
  120: '120日留存',
  135: '135日留存',
  150: '150日留存',
  165: '165日留存',
  180: '180日留存',
  195: '195日留存',
  210: '210日留存',
  225: '225日留存',
  240: '240日留存',
  255: '255日留存',
  270: '270日留存',
  285: '285日留存',
  300: '300日留存',
  315: '315日留存',
  330: '330日留存',
  345: '345日留存',
  360: '360日留存'
}

/**
 * 为单行数据添加元信息
 * @param {Object} row - 数据行
 * @param {Date} exportDate - 导出日期
 * @param {string} dateFieldName - 日期字段名称
 * @returns {Object} 添加了_meta的数据行
 */
export function addMetaInfo(row, exportDate, dateFieldName = '日期') {
  const dataDate = parseDataDate(row[dateFieldName])
  const maxDays = getDaysDiff(exportDate, dataDate)
  
  // 检查各里程碑是否完整
  const meta = {
    maxDays,
    dataDate,
    hasD1: maxDays >= 1,
    hasD7: maxDays >= 7,
    hasD14: maxDays >= 14,
    hasD21: maxDays >= 21,
    hasD30: maxDays >= 30,
    hasD42: maxDays >= 42,
    hasD60: maxDays >= 60,
    hasD75: maxDays >= 75,
    hasD90: maxDays >= 90,
    hasD105: maxDays >= 105,
    hasD120: maxDays >= 120,
    hasD135: maxDays >= 135,
    hasD150: maxDays >= 150,
    hasD165: maxDays >= 165,
    hasD180: maxDays >= 180,
    hasD195: maxDays >= 195,
    hasD210: maxDays >= 210,
    hasD225: maxDays >= 225,
    hasD240: maxDays >= 240,
    hasD255: maxDays >= 255,
    hasD270: maxDays >= 270,
    hasD285: maxDays >= 285,
    hasD300: maxDays >= 300,
    hasD315: maxDays >= 315,
    hasD330: maxDays >= 330,
    hasD345: maxDays >= 345,
    hasD360: maxDays >= 360,
    // 标记不完整的里程碑
    missingMilestones: MILESTONE_DAYS.filter(d => d > maxDays)
  }
  
  // ROI单调性校验：D(N) ROI 应 >= D(N-1) ROI（累积收入单调递增）
  // 若 D(N) ROI < 上一个有效D(N-1) ROI，则标记D(N)异常并剔除
  let lastValidROI = null
  MILESTONE_DAYS.forEach(day => {
    const isComplete = meta[`hasD${day}`] !== undefined ? meta[`hasD${day}`] : (maxDays >= day)
    if (!isComplete) return
    const fieldName = ROI_FIELDS[day]
    if (!fieldName) return
    const val = Number(row[fieldName])
    if (isNaN(val) || val === 0) {
      meta[`hasD${day}`] = false // ROI为0或无效，数据未跑满，剔除
      return
    }
    if (lastValidROI !== null && val < lastValidROI) {
      meta[`hasD${day}`] = false // ROI异常，剔除
    } else {
      lastValidROI = val
      // 对于每日里程碑，确保 hasD{N} 标记为 true
      if (meta[`hasD${day}`] === undefined) meta[`hasD${day}`] = true
    }
  })
  
  // 留存率单调性校验：D(N) 留存 应 <= D(N-1) 留存（留存衰减单调递减）
  // 若 D(N) 留存 > 上一个有效D(N-1) 留存，则标记D(N)异常并剔除
  let lastValidRetention = null
  MILESTONE_DAYS.forEach(day => {
    if (!meta[`hasD${day}`]) return
    const fieldName = RETENTION_FIELDS[day]
    if (!fieldName) return
    const val = Number(row[fieldName])
    if (isNaN(val) || val === 0) {
      meta[`hasD${day}`] = false // 留存率为0或无效，数据未跑满，剔除
      return
    }
    if (lastValidRetention !== null && val > lastValidRetention) {
      meta[`hasD${day}`] = false // 留存异常，剔除
    } else {
      lastValidRetention = val
    }
  })
  
  return {
    ...row,
    _meta: meta
  }
}

/**
 * 清洗数据
 * @param {Array} data - 原始数据
 * @param {Date} exportDate - 导出日期
 * @param {Object} options - 配置选项
 * @returns {Object} 清洗后的数据和报告
 */
export function cleanData(data, exportDate, options = {}) {
  const {
    dateFieldName = '日期',
    strictMode = false // 严格模式：剔除不完整数据
  } = options
  
  if (!exportDate) {
    throw new Error('缺少导出日期，请检查文件名格式')
  }
  
  // 为每行添加元信息
  const dataWithMeta = data.map(row => addMetaInfo(row, exportDate, dateFieldName))
  
  // 生成数据完整性报告
  const report = generateIntegrityReport(dataWithMeta)
  
  // 过滤数据（可选）
  let cleanedData = dataWithMeta
  
  if (strictMode) {
    // 严格模式：只保留有D7数据的记录
    cleanedData = dataWithMeta.filter(row => row._meta.hasD7)
  }
  
  return {
    data: cleanedData,
    rawCount: data.length,
    cleanedCount: cleanedData.length,
    removedCount: data.length - cleanedData.length,
    report
  }
}

/**
 * 生成数据完整性报告
 * @param {Array} dataWithMeta - 带元信息的数据
 * @returns {Object} 完整性报告
 */
export function generateIntegrityReport(dataWithMeta) {
  const report = {
    total: dataWithMeta.length,
    byDay: {},
    byMilestone: {},
    dateRange: null
  }
  
  // 按最大天数分组统计
  MILESTONE_DAYS.forEach(day => {
    report.byDay[day] = dataWithMeta.filter(row => row._meta.maxDays >= day).length
  })
  
  // 按里程碑完整性统计
  const milestones = [1, 7, 14, 21, 30, 42, 60, 75, 90, 120, 180]
  milestones.forEach(day => {
    const key = `hasD${day}`
    report.byMilestone[day] = {
      complete: dataWithMeta.filter(row => row._meta[key]).length,
      incomplete: dataWithMeta.filter(row => !row._meta[key]).length
    }
  })
  
  // 日期范围
  const dates = dataWithMeta
    .map(row => row._meta.dataDate)
    .filter(d => d)
    .sort((a, b) => a - b)
  
  if (dates.length > 0) {
    report.dateRange = {
      min: dates[0],
      max: dates[dates.length - 1]
    }
  }
  
  return report
}

/**
 * 获取有效的里程碑数据
 * @param {Object} row - 数据行（带_meta）
 * @param {number} day - 里程碑天数
 * @returns {Object} { value, isValid }
 */
export function getMilestoneValue(row, day, fieldType = 'roi') {
  const fields = fieldType === 'roi' ? ROI_FIELDS : 
                 fieldType === 'ltv' ? LTV_FIELDS : RETENTION_FIELDS
  
  const fieldName = fields[day]
  if (!fieldName) return { value: null, isValid: false }
  
  const metaKey = `hasD${day}`
  const isValid = row._meta && row._meta[metaKey]
  
  return {
    value: row[fieldName],
    isValid,
    fieldName
  }
}

/**
 * 过滤有效数据
 * @param {Array} data - 数据
 * @param {string} fieldName - 字段名
 * @returns {Array} 有效数据
 */
export function filterValidData(data, fieldName) {
  return data.filter(row => row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '')
}

export default {
  MILESTONE_DAYS,
  ROI_FIELDS,
  LTV_FIELDS,
  RETENTION_FIELDS,
  addMetaInfo,
  cleanData,
  generateIntegrityReport,
  getMilestoneValue,
  filterValidData
}
