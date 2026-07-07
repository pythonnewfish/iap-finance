import { FIELD_MAPPING } from '../constants/fieldMapping'
import { getWeekRange, getISOWeek } from './parser'
import { getVATRate } from '../constants/vatRates'

/**
 * 数据聚合服务
 * 支持按产品、渠道、地区、周进行数据聚合
 */

// 默认里程碑天数：D1-D30每日 + D36起每15天
const DEFAULT_MILESTONES = [
  ...Array.from({ length: 30 }, (_, i) => i + 1),  // D1~D30
  36, 42, 48, 54, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360
]

// 获取字段的Excel列名
function getFieldName(category, key) {
  return FIELD_MAPPING[category]?.[key] || key
}

/**
 * 聚合函数：求和
 */
function sum(arr) {
  return arr.reduce((acc, val) => acc + (Number(val) || 0), 0)
}

/**
 * 聚合函数：加权平均
 */
function weightedAvg(values, weights) {
  const valid = values.map((v, i) => ({ v: Number(v) || 0, w: Number(weights[i]) || 0 }))
    .filter(item => item.w > 0)
  
  if (valid.length === 0) return null
  
  const totalWeight = valid.reduce((acc, item) => acc + item.w, 0)
  const weightedSum = valid.reduce((acc, item) => acc + item.v * item.w, 0)
  
  return weightedSum / totalWeight
}

/**
 * 聚合ROI计算：sum(ROI × 消耗) / sum(消耗)
 * 数学等价：总收入 / 总消耗
 * @param {Array} roiValues - 各行ROI值
 * @param {Array} spendValues - 各行消耗值
 * @returns {number|null} 聚合ROI
 */
function computeAggROI(roiValues, spendValues) {
  let totalRevenue = 0
  let totalSpend = 0
  for (let i = 0; i < roiValues.length; i++) {
    const roi = Number(roiValues[i]) || 0
    const spend = Number(spendValues[i]) || 0
    totalRevenue += roi * spend
    totalSpend += spend
  }
  return totalSpend > 0 ? totalRevenue / totalSpend : null
}

/**
 * 聚合函数：平均值
 */
function avg(arr) {
  const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v))
  if (valid.length === 0) return null
  return sum(valid) / valid.length
}

/**
 * 按组聚合数据
 * @param {Array} data - 数据
 * @param {string} groupBy - 分组字段（media/country/appName）
 * @param {Object} options - 聚合选项
 */
export function aggregateByGroup(data, groupBy, options = {}) {
  const {
    includeMilestones = DEFAULT_MILESTONES,
    vatMode = false
  } = options
  
  const fieldName = getFieldName('dimensions', groupBy)
  
  // 按分组字段分组
  const groups = {}
  
  data.forEach(row => {
    const key = row[fieldName] || '未知'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(row)
  })
  
  // 计算每个分组的聚合指标
  const result = Object.entries(groups).map(([groupName, rows]) => {
    const agg = aggregateRows(rows, { includeMilestones, vatMode })
    return {
      name: groupName,
      ...agg
    }
  })
  
  // 按消耗排序
  result.sort((a, b) => (b.spend || 0) - (a.spend || 0))
  
  return result
}

/**
 * 聚合多行数据
 * @param {Object} options.vatMode - 是否扣除增值税
 */
export function aggregateRows(rows, options = {}) {
  const {
    includeMilestones = DEFAULT_MILESTONES,
    vatMode = false
  } = options
  
  if (rows.length === 0) return {}
  
  // VAT 扣除辅助函数：获取行的增值税除数
  const vatDivisor = (r) => vatMode ? (1 + getVATRate(r[getFieldName('dimensions', 'country')])) : 1
  
  // 分离付费和自然量数据
  const paidRows = rows.filter(r => !r._isOrganic)
  
  // 基础指标：求和
  // 新增用户：仅付费用户（排除自然量）
  const newUsers = sum(paidRows.map(r => r[getFieldName('acquisition', 'newUsers')]))
  // 消耗：仅付费（自然量消耗为0）
  const spend = sum(paidRows.map(r => r[getFieldName('acquisition', 'spend')]))
  // 收入：包含自然量收入（自然量收入并入对应周收入）
  // vatMode=true 时：毛收入 / (1 + VAT税率)
  const revenue = sum(rows.map(r => (Number(r[getFieldName('revenue', 'totalRevenue')]) || 0) / vatDivisor(r)))
  
  // 派生指标
  const cpa = newUsers > 0 ? spend / newUsers : 0
  // 付费率：按活跃用户加权（不受 VAT 影响）
  const payingRateValues = paidRows.map(r => r[getFieldName('monetization', 'payingRate')])
  const activeUsersArr = paidRows.map(r => r[getFieldName('acquisition', 'activeUsers')])
  const avgPayingRate = weightedAvg(payingRateValues, activeUsersArr)
  // ARPPU：按活跃用户加权，vatMode 时逐行扣除
  const arppuValues = paidRows.map(r => (Number(r[getFieldName('monetization', 'arppu')]) || 0) / vatDivisor(r))
  const avgArppu = weightedAvg(arppuValues, activeUsersArr)
  const avgArpudau = avg(paidRows.map(r => (Number(r[getFieldName('revenue', 'arpudau')]) || 0) / vatDivisor(r)))
  
  // 里程碑数据
  // ROI：按消耗加权 sum(ROI×消耗)/sum(消耗) = 总收入/总消耗
  // LTV/留存率：按新增用户加权（代表人均价值/留存比例）
  // 关键：只对 _meta.hasD{N} === true 的完整数据计算，不完整数据设为null
  const milestones = {}
  includeMilestones.forEach(day => {
    const metaKey = `hasD${day}`
    const roiField = day === 1 ? 'd1' : `d${day}`
    const ltvField = day === 1 ? 'd1' : `d${day}`
    const retentionField = day === 1 ? 'd1' : `d${day}`
    
    // 只筛选具有完整里程碑数据的行（排除自然量）
    // 优先查 hasD{N} 标记，回退到 maxDays >= day
    const completeRows = paidRows.filter(r => {
      const hasFlag = r._meta?.[metaKey]
      if (hasFlag !== undefined) return hasFlag
      // cleaner 未设置 hasD{N} 的每日里程碑，用 maxDays 判断
      return (r._meta?.maxDays || 0) >= day
    })
    
    if (completeRows.length === 0) {
      // 无完整数据，标记为null
      milestones[`roi_d${day}`] = null
      milestones[`ltv_d${day}`] = null
      milestones[`retention_d${day}`] = null
    } else {
      // ROI/LTV: vatMode 时逐行扣除增值税
      const roiValues = completeRows.map(r => (Number(r[getFieldName('roi', roiField)]) || 0) / vatDivisor(r))
      const ltvValues = completeRows.map(r => (Number(r[getFieldName('ltv', ltvField)]) || 0) / vatDivisor(r))
      const retentionValues = completeRows.map(r => r[getFieldName('retention', retentionField)])
      const newUsersArr = completeRows.map(r => r[getFieldName('acquisition', 'newUsers')])
      const spendArr = completeRows.map(r => r[getFieldName('acquisition', 'spend')])
      
      // ROI按消耗加权：sum(ROI×消耗)/sum(消耗)
      const roi = computeAggROI(roiValues, spendArr)
      const ltv = weightedAvg(ltvValues, newUsersArr)
      const ret = weightedAvg(retentionValues, newUsersArr)
      // 0值视为数据未跑满，置为null
      milestones[`roi_d${day}`] = roi !== null && roi > 0 ? roi : null
      milestones[`ltv_d${day}`] = ltv !== null && ltv > 0 ? ltv : null
      milestones[`retention_d${day}`] = ret !== null && ret > 0 ? ret : null
    }
  })
  
  return {
    count: rows.length,
    newUsers,
    spend,
    revenue,
    cpa,
    avgPayingRate,
    avgArppu,
    avgArpudau,
    ...milestones
  }
}

/**
 * 按周聚合数据
 */
export function aggregateByWeek(data, options = {}) {
  const { includeMilestones = DEFAULT_MILESTONES, vatMode = false } = options
  
  // 按周分组
  const weeks = {}
  
  data.forEach(row => {
    const dateField = getFieldName('dimensions', 'date')
    const dateStr = row[dateField]
    if (!dateStr) return
    
    // 解析日期
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return
    
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
    const weekInfo = getISOWeek(date)
    const weekKey = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        weekKey,
        year: weekInfo.year,
        week: weekInfo.week,
        rows: []
      }
    }
    weeks[weekKey].rows.push(row)
  })
  
  // 聚合每周数据
  const result = Object.entries(weeks)
    .map(([key, weekData]) => {
      const { weekKey, year, week, rows } = weekData
      const agg = aggregateRows(rows, { includeMilestones, vatMode })
      
      // 获取该周的日期范围
      const dates = rows
        .map(r => {
          const match = r[getFieldName('dimensions', 'date')]?.match(/^(\d{4})-(\d{2})-(\d{2})/)
          return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : null
        })
        .filter(d => d)
      
      const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
      
      return {
        weekKey,
        year,
        week,
        dateRange: minDate && maxDate ? `${minDate.toLocaleDateString('zh-CN')} ~ ${maxDate.toLocaleDateString('zh-CN')}` : '',
        ...agg
      }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.week - b.week
    })
  
  return result
}

/**
 * 获取所有可选周列表（用于周选择器）
 */
export function getWeekOptions(data) {
  if (!data || data.length === 0) return []
  
  const dateField = getFieldName('dimensions', 'date')
  const weekMap = {}
  
  data.forEach(row => {
    const dateStr = row[dateField]
    if (!dateStr) return
    
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return
    
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
    const weekInfo = getISOWeek(date)
    const weekKey = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`
    
    if (!weekMap[weekKey]) {
      const weekRange = getWeekRange(date)
      weekMap[weekKey] = {
        weekKey,
        year: weekInfo.year,
        week: weekInfo.week,
        start: weekRange.start,
        end: weekRange.end,
        label: `${weekRange.start.toLocaleDateString('zh-CN')} ~ ${weekRange.end.toLocaleDateString('zh-CN')} (${weekKey})`
      }
    }
  })
  
  return Object.values(weekMap).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.week - a.week // 最新的周在前
  })
}

/**
 * 根据指定的周范围获取聚合数据
 */
export function getWeekDataByRange(data, weekOption, options = {}) {
  const { vatMode = false } = options
  if (!data || data.length === 0 || !weekOption) return null
  
  const dateField = getFieldName('dimensions', 'date')
  
  const rows = data.filter(row => {
    const dateStr = row[dateField]
    if (!dateStr) return false
    
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return false
    
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
    return date >= weekOption.start && date <= weekOption.end
  })
  
  if (rows.length === 0) return null
  
  return {
    ...aggregateRows(rows, { vatMode }),
    weekRange: `${weekOption.start.toLocaleDateString('zh-CN')} ~ ${weekOption.end.toLocaleDateString('zh-CN')}`,
    weekKey: weekOption.weekKey
  }
}

/**
 * 获取指定周的原始行数据（用于按产品等分组聚合）
 */
export function getWeekRows(data, weekOption) {
  if (!data || data.length === 0 || !weekOption) return []
  
  const dateField = getFieldName('dimensions', 'date')
  
  return data.filter(row => {
    const dateStr = row[dateField]
    if (!dateStr) return false
    
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return false
    
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
    return date >= weekOption.start && date <= weekOption.end
  })
}

/**
 * 获取最近一周数据（导出日期往前推一周）
 * 如导出日期为6月15日（周一），则最近一周为6月8日~6月14日
 */
export function getCurrentWeekData(data, exportDate, options = {}) {
  const { vatMode = false } = options
  if (!data || data.length === 0 || !exportDate) return null
  
  // 往前推7天
  const prevWeekDate = new Date(exportDate)
  prevWeekDate.setDate(prevWeekDate.getDate() - 7)
  const weekRange = getWeekRange(prevWeekDate)
  
  const currentWeekRows = data.filter(row => {
    const dateField = getFieldName('dimensions', 'date')
    const dateStr = row[dateField]
    if (!dateStr) return false
    
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return false
    
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}`)
    return date >= weekRange.start && date <= weekRange.end
  })
  
  if (currentWeekRows.length === 0) return null
  
  return {
    ...aggregateRows(currentWeekRows, { vatMode }),
    weekRange: `${weekRange.start.toLocaleDateString('zh-CN')} ~ ${weekRange.end.toLocaleDateString('zh-CN')}`
  }
}

/**
 * 获取历史里程碑数据
 * 只返回有完整里程碑数据的记录
 */
export function getMilestoneData(data, day) {
  if (!data || data.length === 0) return []
  
  const metaKey = `hasD${day}`
  
  return data
    .filter(row => row._meta?.[metaKey])
    .map(row => ({
      row,
      meta: row._meta
    }))
}

export default {
  aggregateByGroup,
  aggregateByWeek,
  aggregateRows,
  getCurrentWeekData,
  getWeekOptions,
  getWeekDataByRange,
  getWeekRows,
  getMilestoneData
}
