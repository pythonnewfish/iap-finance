/**
 * 字段映射配置
 * 将数据中台Excel列名映射为内部标准字段名
 */

export const FIELD_MAPPING = {
  // 维度字段
  dimensions: {
    date: '日期',
    media: '媒体',
    appId: '应用id',
    appName: '应用名称',
    country: '国家'
  },
  
  // 投放字段
  acquisition: {
    newUsers: '新增用户',
    cpa: 'cpa',
    activeUsers: '活跃用户数',
    spend: '消耗($)'
  },
  
  // 收入字段
  revenue: {
    totalRevenue: '总收入($)',
    iapRevenue: '计费总收入($)',
    adRevenue: '广告总收入($)',
    arpudau: 'dau arpu'
  },
  
  // 付费字段
  monetization: {
    payingRate: '付费率',
    arppu: '付费arppu'
  },
  
  // ROI字段
  roi: {
    d1: '首日ROI',
    d2: '2日ROI',
    d3: '3日ROI',
    d4: '4日ROI',
    d5: '5日ROI',
    d6: '6日ROI',
    d7: '7日ROI',
    d8: '8日ROI',
    d9: '9日ROI',
    d10: '10日ROI',
    d11: '11日ROI',
    d12: '12日ROI',
    d13: '13日ROI',
    d14: '14日ROI',
    d15: '15日ROI',
    d16: '16日ROI',
    d17: '17日ROI',
    d18: '18日ROI',
    d19: '19日ROI',
    d20: '20日ROI',
    d21: '21日ROI',
    d22: '22日ROI',
    d23: '23日ROI',
    d24: '24日ROI',
    d25: '25日ROI',
    d26: '26日ROI',
    d27: '27日ROI',
    d28: '28日ROI',
    d29: '29日ROI',
    d30: '30日ROI',
    d36: '36日ROI',
    d42: '42日ROI',
    d48: '48日ROI',
    d54: '54日ROI',
    d60: '60日ROI',
    d75: '75日ROI',
    d90: '90日ROI',
    d105: '105日ROI',
    d120: '120日ROI',
    d135: '135日ROI',
    d150: '150日ROI',
    d165: '165日ROI',
    d180: '180日ROI',
    d195: '195日ROI',
    d210: '210日ROI',
    d225: '225日ROI',
    d240: '240日ROI',
    d255: '255日ROI',
    d270: '270日ROI',
    d285: '285日ROI',
    d300: '300日ROI',
    d315: '315日ROI',
    d330: '330日ROI',
    d345: '345日ROI',
    d360: '360日ROI'
  },
  
  // LTV字段
  ltv: {
    d1: '新增 arpu',
    d2: 'LTV2',
    d3: 'LTV3',
    d4: 'LTV4',
    d5: 'LTV5',
    d6: 'LTV6',
    d7: 'LTV7',
    d8: 'LTV8',
    d9: 'LTV9',
    d10: 'LTV10',
    d11: 'LTV11',
    d12: 'LTV12',
    d13: 'LTV13',
    d14: 'LTV14',
    d15: 'LTV15',
    d16: 'LTV16',
    d17: 'LTV17',
    d18: 'LTV18',
    d19: 'LTV19',
    d20: 'LTV20',
    d21: 'LTV21',
    d22: 'LTV22',
    d23: 'LTV23',
    d24: 'LTV24',
    d25: 'LTV25',
    d26: 'LTV26',
    d27: 'LTV27',
    d28: 'LTV28',
    d29: 'LTV29',
    d30: 'LTV30',
    d36: 'LTV36',
    d42: 'LTV42',
    d48: 'LTV48',
    d54: 'LTV54',
    d60: 'LTV60',
    d75: 'LTV75',
    d90: 'LTV90',
    d105: 'LTV105',
    d120: 'LTV120',
    d135: 'LTV135',
    d150: 'LTV150',
    d165: 'LTV165',
    d180: 'LTV180',
    d195: 'LTV195',
    d210: 'LTV210',
    d225: 'LTV225',
    d240: 'LTV240',
    d255: 'LTV255',
    d270: 'LTV270',
    d285: 'LTV285',
    d300: 'LTV300',
    d315: 'LTV315',
    d330: 'LTV330',
    d345: 'LTV345',
    d360: 'LTV360'
  },
  
  // 留存字段（包含每日+月度完整数据）
  retention: {
    d1: '1日留存',
    d2: '2日留存',
    d3: '3日留存',
    d4: '4日留存',
    d5: '5日留存',
    d6: '6日留存',
    d7: '7日留存',
    d8: '8日留存',
    d9: '9日留存',
    d10: '10日留存',
    d11: '11日留存',
    d12: '12日留存',
    d13: '13日留存',
    d14: '14日留存',
    d15: '15日留存',
    d16: '16日留存',
    d17: '17日留存',
    d18: '18日留存',
    d19: '19日留存',
    d20: '20日留存',
    d21: '21日留存',
    d22: '22日留存',
    d23: '23日留存',
    d24: '24日留存',
    d25: '25日留存',
    d26: '26日留存',
    d27: '27日留存',
    d28: '28日留存',
    d29: '29日留存',
    d30: '30日留存',
    d36: '36日留存',
    d42: '42日留存',
    d48: '48日留存',
    d54: '54日留存',
    d60: '60日留存',
    d75: '75日留存',
    d90: '90日留存',
    d105: '105日留存',
    d120: '120日留存',
    d135: '135日留存',
    d150: '150日留存',
    d165: '165日留存',
    d180: '180日留存',
    d195: '195日留存',
    d210: '210日留存',
    d225: '225日留存',
    d240: '240日留存',
    d255: '255日留存',
    d270: '270日留存',
    d285: '285日留存',
    d300: '300日留存',
    d315: '315日留存',
    d330: '330日留存',
    d345: '345日留存',
    d360: '360日留存'
  },
  
  // 付费用户留存字段
  payingRetention: {
    d1: '付费用户1日留存率',
    d2: '付费用户2日留存率',
    d3: '付费用户3日留存率',
    d4: '付费用户4日留存率',
    d5: '付费用户5日留存率',
    d6: '付费用户6日留存率',
    d7: '付费用户7日留存率',
    d8: '付费用户8日留存率',
    d9: '付费用户9日留存率',
    d10: '付费用户10日留存率',
    d11: '付费用户11日留存率',
    d12: '付费用户12日留存率',
    d13: '付费用户13日留存率',
    d14: '付费用户14日留存率',
    d15: '付费用户15日留存率',
    d16: '付费用户16日留存率',
    d17: '付费用户17日留存率',
    d18: '付费用户18日留存率',
    d19: '付费用户19日留存率',
    d20: '付费用户20日留存率',
    d21: '付费用户21日留存率',
    d22: '付费用户22日留存率',
    d23: '付费用户23日留存率',
    d24: '付费用户24日留存率',
    d25: '付费用户25日留存率',
    d26: '付费用户26日留存率',
    d27: '付费用户27日留存率',
    d28: '付费用户28日留存率',
    d29: '付费用户29日留存率',
    d30: '付费用户30日留存率'
  },
  
  // 倍率字段
  multiplier: {
    d30_d7: '30/7倍率商',
    d60_d30: '60/30倍率商',
    d90_d60: '90/60倍率商',
    d180_d30: '180/30倍率商',
    d360_d210: '360/210倍率商'
  }
}

// 反向映射：内部字段名 -> Excel列名
export const REVERSE_MAPPING = {}

Object.entries(FIELD_MAPPING).forEach(([category, fields]) => {
  if (typeof fields === 'object' && !Array.isArray(fields)) {
    Object.entries(fields).forEach(([key, value]) => {
      REVERSE_MAPPING[key] = value
    })
  }
})

// 关键里程碑定义
export const MILESTONES = [
  { day: 1, key: 'd1', label: 'D1', roiField: 'd1', ltvField: 'd1', retentionField: 'd1' },
  { day: 7, key: 'd7', label: 'D7', roiField: 'd7', ltvField: 'd7', retentionField: 'd7' },
  { day: 14, key: 'd14', label: 'D14', roiField: 'd14', ltvField: 'd14', retentionField: 'd14' },
  { day: 21, key: 'd21', label: 'D21', roiField: 'd21', ltvField: 'd21', retentionField: 'd21' },
  { day: 30, key: 'd30', label: 'D30', roiField: 'd30', ltvField: 'd30', retentionField: 'd30' },
  { day: 42, key: 'd42', label: 'D42', roiField: 'd42', ltvField: 'd42', retentionField: 'd42' },
  { day: 60, key: 'd60', label: 'D60', roiField: 'd60', ltvField: 'd60', retentionField: 'd60' },
  { day: 90, key: 'd90', label: 'D90', roiField: 'd90', ltvField: 'd90', retentionField: 'd90' },
  { day: 120, key: 'd120', label: 'D120', roiField: 'd120', ltvField: 'd120', retentionField: 'd120' },
  { day: 180, key: 'd180', label: 'D180', roiField: 'd180', ltvField: 'd180', retentionField: 'd180' }
]

// 指标评估标准
export const BENCHMARKS = {
  roi: {
    d1: { min: 0.15, target: 0.20, label: '≥15-20%' },
    d7: { min: 0.40, target: 0.60, label: '≥40-60%' },
    d30: { min: 0.80, target: 1.00, label: '≥80-100%' },
    d60: { min: 1.20, target: 1.50, label: '≥120-150%' },
    d90: { min: 1.50, target: 2.00, label: '≥150-200%' }
  },
  retention: {
    d1: { min: 0.35, target: 0.40, label: '≥35-40%' },
    d7: { min: 0.18, target: 0.25, label: '≥18-25%' },
    d30: { min: 0.10, target: 0.15, label: '≥10-15%' }
  },
  payingRate: {
    min: 0.03,
    target: 0.05,
    label: '≥3-5%'
  }
}

// 获取字段的标准值
export function getFieldValue(row, category, key) {
  const fieldName = FIELD_MAPPING[category]?.[key]
  if (!fieldName) return null
  return row[fieldName]
}

// 格式化百分比
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

// 格式化金额
export function formatCurrency(value, currency = '$', decimals = 2) {
  if (value === null || value === undefined) return '-'
  return `${currency}${Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

// 格式化数字
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default {
  FIELD_MAPPING,
  REVERSE_MAPPING,
  MILESTONES,
  BENCHMARKS,
  getFieldValue,
  formatPercent,
  formatCurrency,
  formatNumber
}
