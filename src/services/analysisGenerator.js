/**
 * 标准分析模式生成器
 * 为每个图表生成结构化的分析洞察
 */

/**
 * 分析结果结构
 * @typedef {Object} AnalysisResult
 * @property {string} title - 分析标题
 * @property {string} summary - 一句话总结
 * @property {string[]} insights - 关键洞察列表
 * @property {string} trend - 趋势判断 (上升/下降/稳定/波动)
 * @property {string} alert - 预警信息 (可选)
 */

// 趋势判断阈值
const TREND_THRESHOLD = {
  significant: 0.1,    // 10%以上变化视为显著
  moderate: 0.05,      // 5%以上变化视为中等
  stable: 0.02         // 2%以内视为稳定
}

// ROI基准值（买量型IAP游戏常见基准）
const ROI_BENCHMARK = {
  d1: { min: 0.01, good: 0.015, excellent: 0.02 },      // D1: 1%-2%
  d7: { min: 0.07, good: 0.08, excellent: 0.10 },       // D7: 7%-10%
  d30: { min: 0.15, good: 0.18, excellent: 0.25 },      // D30: 15%-25%
  d60: { min: 0.22, good: 0.28, excellent: 0.35 }       // D60: 22%-35%
}

// 留存率基准值
const RETENTION_BENCHMARK = {
  d1: { min: 0.30, good: 0.40, excellent: 0.50 },
  d7: { min: 0.12, good: 0.18, excellent: 0.25 },
  d30: { min: 0.05, good: 0.08, excellent: 0.12 },
  d60: { min: 0.02, good: 0.04, excellent: 0.06 }
}

// 付费留存基准值（付费用户次日留存）
const PAYING_RETENTION_BENCHMARK = {
  d1: { min: 0.60, good: 0.75, excellent: 0.85 }  // D1付费留存: 60%-85%
}

/**
 * 计算周环比变化
 */
function calculateWoW(current, previous) {
  if (previous === 0 || previous === null) return null
  return (current - previous) / Math.abs(previous)
}

/**
 * 判断趋势方向
 */
function getTrendDirection(values) {
  if (!values || values.length < 2) return '数据不足'
  
  const valid = values.filter(v => v !== null && v !== undefined)
  if (valid.length < 2) return '数据不足'
  
  const first = valid[0]
  const last = valid[valid.length - 1]
  const change = (last - first) / Math.abs(first || 1)
  
  if (change > TREND_THRESHOLD.significant) return '显著上升'
  if (change > TREND_THRESHOLD.moderate) return '小幅上升'
  if (change > -TREND_THRESHOLD.moderate) return '相对稳定'
  if (change > -TREND_THRESHOLD.significant) return '小幅下降'
  return '显著下降'
}

/**
 * 评估指标水平
 */
function evaluateLevel(value, benchmark) {
  if (value === null || value === undefined) return '无数据'
  if (value >= benchmark.excellent) return '优秀'
  if (value >= benchmark.good) return '良好'
  if (value >= benchmark.min) return '一般'
  return '偏低'
}

/**
 * ROI周趋势分析
 */
export function analyzeROITrend(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { title: 'ROI周趋势分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const insights = []
  let alerts = []
  
  // 为每个里程碑找到最近有完整数据的周
  function findLatestValidWeek(field) {
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const val = weeklyData[i][field]
      if (val !== null && val !== undefined && val > 0) {
        return { week: weeklyData[i], value: val, weekKey: weeklyData[i].weekKey, index: i }
      }
    }
    return null
  }
  
  // 找前一周的有效数据
  function findPrevValidWeek(field, fromIndex) {
    for (let i = fromIndex - 1; i >= 0; i--) {
      const val = weeklyData[i][field]
      if (val !== null && val !== undefined && val > 0) return val
    }
    return null
  }
  
  const d1Data = findLatestValidWeek('roi_d1')
  const d7Data = findLatestValidWeek('roi_d7')
  const d30Data = findLatestValidWeek('roi_d30')
  const d60Data = findLatestValidWeek('roi_d60')
  
  // D1 ROI 分析
  if (d1Data) {
    const d1Level = evaluateLevel(d1Data.value, ROI_BENCHMARK.d1)
    insights.push(`D1 ROI: ${(d1Data.value * 100).toFixed(1)}% (${d1Level}) [${d1Data.weekKey}]`)
    const d1Prev = findPrevValidWeek('roi_d1', d1Data.index)
    if (d1Prev) {
      const wow = calculateWoW(d1Data.value, d1Prev)
      insights.push(`  周环比: ${wow > 0 ? '+' : ''}${(wow * 100).toFixed(1)}%`)
    }
  }
  
  // D7 ROI 分析
  if (d7Data) {
    const d7Level = evaluateLevel(d7Data.value, ROI_BENCHMARK.d7)
    insights.push(`D7 ROI: ${(d7Data.value * 100).toFixed(1)}% (${d7Level}) [${d7Data.weekKey}]`)
    const d7Prev = findPrevValidWeek('roi_d7', d7Data.index)
    if (d7Prev) {
      const wow = calculateWoW(d7Data.value, d7Prev)
      insights.push(`  周环比: ${wow > 0 ? '+' : ''}${(wow * 100).toFixed(1)}%`)
    }
  }
  
  // D30/D60 分析
  if (d30Data) {
    insights.push(`D30 ROI: ${(d30Data.value * 100).toFixed(1)}% (${evaluateLevel(d30Data.value, ROI_BENCHMARK.d30)}) [${d30Data.weekKey}]`)
  }
  if (d60Data) {
    insights.push(`D60 ROI: ${(d60Data.value * 100).toFixed(1)}% (${evaluateLevel(d60Data.value, ROI_BENCHMARK.d60)}) [${d60Data.weekKey}]`)
  }
  
  // 趋势判断：使用有效D7数据
  const d7Values = weeklyData
    .map(w => w.roi_d7)
    .filter(v => v !== null && v !== undefined && v > 0)
  const d7Trend = getTrendDirection(d7Values.slice(-4))
  
  // 摘要
  let summary = ''
  if (d7Data) {
    summary = `D7 ROI ${evaluateLevel(d7Data.value, ROI_BENCHMARK.d7)}(${(d7Data.value * 100).toFixed(1)}%, ${d7Data.weekKey})，近4周${d7Trend}`
  } else if (d1Data) {
    summary = `D7 数据未跑满，D1 ROI ${(d1Data.value * 100).toFixed(1)}% (${d1Data.weekKey})，近4周${d7Trend}`
  } else {
    summary = `ROI数据不足`
  }
  
  return {
    title: 'ROI周趋势分析',
    summary,
    insights,
    trend: d7Trend,
    alerts
  }
}

/**
 * 留存率周趋势分析
 * 注意：weeklyData中的留存字段为 retention_d1, retention_d7, etc.
 * 最近一周可能未跑满数据，需找到最近有完整数据的周进行分析
 */
export function analyzeRetentionTrend(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { title: '留存率周趋势', summary: '暂无数据', insights: [], trend: '无' }
  }

  const insights = []
  let alerts = []
  
  // 为每个里程碑找到最近有完整数据的周
  function findLatestValidWeek(field) {
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const val = weeklyData[i][field]
      if (val !== null && val !== undefined && val > 0) {
        return { week: weeklyData[i], value: +(val * 100).toFixed(1), weekKey: weeklyData[i].weekKey, index: i }
      }
    }
    return null
  }
  
  const d1Data = findLatestValidWeek('retention_d1')
  const d7Data = findLatestValidWeek('retention_d7')
  const d30Data = findLatestValidWeek('retention_d30')
  const d60Data = findLatestValidWeek('retention_d60')
  
  // D1 留存分析
  if (d1Data) {
    const d1Level = evaluateLevel(d1Data.value / 100, RETENTION_BENCHMARK.d1)
    insights.push(`D1 留存: ${d1Data.value}% (${d1Level}) [${d1Data.weekKey}]`)
    
    // 找上一周的有效数据计算环比
    for (let i = d1Data.index - 1; i >= 0; i--) {
      const prevVal = weeklyData[i].retention_d1
      if (prevVal !== null && prevVal !== undefined && prevVal > 0) {
        const wow = calculateWoW(d1Data.value, +(prevVal * 100).toFixed(1))
        insights.push(`  周环比: ${wow > 0 ? '+' : ''}${(wow * 100).toFixed(1)}%`)
        break
      }
    }
  }
  
  // D7 留存分析
  if (d7Data) {
    const d7Level = evaluateLevel(d7Data.value / 100, RETENTION_BENCHMARK.d7)
    insights.push(`D7 留存: ${d7Data.value}% (${d7Level}) [${d7Data.weekKey}]`)
  }
  
  // D30 留存分析
  if (d30Data) {
    insights.push(`D30 留存: ${d30Data.value}% (${evaluateLevel(d30Data.value / 100, RETENTION_BENCHMARK.d30)}) [${d30Data.weekKey}]`)
  }
  
  // D60 留存分析
  if (d60Data) {
    insights.push(`D60 留存: ${d60Data.value}% (${evaluateLevel(d60Data.value / 100, RETENTION_BENCHMARK.d60)}) [${d60Data.weekKey}]`)
  }
  
  // 留存衰减分析
  if (d1Data && d7Data) {
    const decayRate = (d1Data.value - d7Data.value) / d1Data.value
    insights.push(`D1→D7 衰减率: ${(decayRate * 100).toFixed(1)}%`)
    if (decayRate > 0.6) {
      alerts.push('D1→D7留存衰减过快(>60%)，建议优化新手体验')
    }
  }
  
  // 趋势判断：使用最近有完整D7数据的周往前推4周
  const d7Values = weeklyData
    .map(w => w.retention_d7)
    .filter(v => v !== null && v !== undefined && v > 0)
  const d7Trend = getTrendDirection(d7Values.slice(-4))
  
  // 摘要
  let summary = ''
  if (d7Data) {
    summary = `D7 留存${evaluateLevel(d7Data.value / 100, RETENTION_BENCHMARK.d7)}(${d7Data.value}%, ${d7Data.weekKey})，近4周${d7Trend}`
  } else if (d1Data) {
    summary = `D7 数据未跑满，D1 留存 ${d1Data.value}% (${d1Data.weekKey})，近4周${d7Trend}`
  } else {
    summary = `留存数据不足`
  }
  
  return {
    title: '留存率周趋势',
    summary,
    insights,
    trend: d7Trend,
    alerts
  }
}

/**
 * CPA & ARPU 趋势分析
 */
export function analyzeCpaArpu(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { title: 'CPA & ARPU 分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const latest = weeklyData[weeklyData.length - 1]
  const previous = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null
  
  const insights = []
  let alerts = []
  
  // CPA 分析
  if (latest.cpa !== null && latest.cpa !== undefined) {
    const cpaWoW = previous?.cpa ? calculateWoW(latest.cpa, previous.cpa) : null
    insights.push(`CPA: $${latest.cpa.toFixed(2)}`)
    if (cpaWoW !== null) {
      insights.push(`  周环比: ${cpaWoW > 0 ? '+' : ''}${(cpaWoW * 100).toFixed(1)}%`)
      if (cpaWoW > 0.2) {
        alerts.push(`CPA环比上涨${(cpaWoW * 100).toFixed(0)}%，获客成本上升`)
      }
    }
  }
  
  // ARPU 分析
  if (latest.arpudau !== null && latest.arpudau !== undefined) {
    insights.push(`DAU ARPU: $${latest.arpudau.toFixed(3)}`)
  }
  
  // ROI 健康度（ARPU/CPA 比值）
  if (latest.cpa > 0 && latest.arpudau > 0) {
    const roiProxy = latest.arpudau / latest.cpa
    insights.push(`日ROI健康度: ${(roiProxy * 100).toFixed(2)}% (ARPU/CPA)`)
    if (roiProxy < 0.02) {
      alerts.push('日ROI偏低，建议优化变现或降低获客成本')
    }
  }
  
  const cpaValues = weeklyData.map(w => w.cpa).filter(v => v !== null)
  const cpaTrend = getTrendDirection(cpaValues.slice(-4))
  
  return {
    title: 'CPA & ARPU 分析',
    summary: `CPA $${latest.cpa?.toFixed(2)}，近4周${cpaTrend}`,
    insights,
    trend: cpaTrend,
    alerts
  }
}

/**
 * LTV 趋势分析
 */
export function analyzeLtv(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { title: 'LTV 趋势分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const latest = weeklyData[weeklyData.length - 1]
  const previous = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null
  
  const insights = []
  let alerts = []
  
  // LTV 里程碑分析
  const milestones = [
    { day: 1, key: 'ltv_d1' },
    { day: 7, key: 'ltv_d7' },
    { day: 14, key: 'ltv_d14' },
    { day: 30, key: 'ltv_d30' },
    { day: 60, key: 'ltv_d60' }
  ]
  
  milestones.forEach(({ day, key }) => {
    const val = latest[key]
    if (val !== null && val !== undefined) {
      insights.push(`LTV D${day}: $${val.toFixed(2)}`)
    }
  })
  
  // LTV 增长分析
  if (latest.ltv_d7 && latest.ltv_d1) {
    const d7Growth = (latest.ltv_d7 - latest.ltv_d1) / latest.ltv_d1
    insights.push(`D1→D7 增长: ${(d7Growth * 100).toFixed(0)}%`)
  }
  
  if (latest.ltv_d30 && latest.ltv_d7) {
    const d30Growth = (latest.ltv_d30 - latest.ltv_d7) / latest.ltv_d7
    insights.push(`D7→D30 增长: ${(d30Growth * 100).toFixed(0)}%`)
  }
  
  const d7Values = weeklyData.map(w => w.ltv_d7).filter(v => v !== null)
  const d7Trend = getTrendDirection(d7Values.slice(-4))
  
  return {
    title: 'LTV 趋势分析',
    summary: `LTV D7 $${latest.ltv_d7?.toFixed(2)}，近4周${d7Trend}`,
    insights,
    trend: d7Trend,
    alerts
  }
}

/**
 * 付费率 & ARPPU 分析
 */
export function analyzeMonetization(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { title: '付费率 & ARPPU 分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const latest = weeklyData[weeklyData.length - 1]
  const previous = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null
  
  const insights = []
  let alerts = []
  
  // 付费率分析
  if (latest.avgPayingRate !== null && latest.avgPayingRate !== undefined) {
    const rate = (latest.avgPayingRate * 100).toFixed(2)
    insights.push(`付费率: ${rate}%`)
    
    if (previous?.avgPayingRate) {
      const wow = calculateWoW(latest.avgPayingRate, previous.avgPayingRate)
      insights.push(`  周环比: ${wow > 0 ? '+' : ''}${(wow * 100).toFixed(1)}%`)
    }
    
    // 付费率基准评估（IAP游戏 3-6-9%）
    if (latest.avgPayingRate < 0.03) {
      alerts.push(`付费率偏低(${rate}%)，建议优化付费引导`)
    } else if (latest.avgPayingRate >= 0.09) {
      insights.push(`付费率优秀(${rate}%)，用户付费意愿强`)
    }
  }
  
  // ARPPU 分析
  if (latest.avgArppu !== null && latest.avgArppu !== undefined) {
    insights.push(`ARPPU: $${latest.avgArppu.toFixed(2)}`)
    
    if (previous?.avgArppu) {
      const wow = calculateWoW(latest.avgArppu, previous.avgArppu)
      insights.push(`  周环比: ${wow > 0 ? '+' : ''}${(wow * 100).toFixed(1)}%`)
    }
  }
  
  // 付费健康度评估
  if (latest.avgPayingRate && latest.avgArppu) {
    const arpuEstimate = latest.avgPayingRate * latest.avgArppu
    insights.push(`估算 ARPU: $${arpuEstimate.toFixed(3)}`)
  }
  
  const prValues = weeklyData.map(w => w.avgPayingRate).filter(v => v !== null)
  const prTrend = getTrendDirection(prValues.slice(-4))
  
  return {
    title: '付费率 & ARPPU 分析',
    summary: `付费率 ${(latest.avgPayingRate * 100).toFixed(2)}%，近4周${prTrend}`,
    insights,
    trend: prTrend,
    alerts
  }
}

/**
 * 产品ROI里程碑分析
 */
export function analyzeROITable(products) {
  if (!products || products.length === 0) {
    return { title: '产品ROI里程碑分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const insights = []
  let alerts = []
  
  products.forEach(product => {
    const name = product.appName || product.name || '产品'
    const roi_d7 = product.roi_d7
    const roi_d30 = product.roi_d30
    
    if (roi_d7 !== null) {
      const level = evaluateLevel(roi_d7, ROI_BENCHMARK.d7)
      insights.push(`${name}: D7 ${(roi_d7 * 100).toFixed(1)}% (${level})`)
    }
    
    // 检查回本进度
    if (roi_d30 !== null && roi_d30 < 0.15) {
      alerts.push(`${name} D30 ROI仅${(roi_d30 * 100).toFixed(1)}%，回本压力较大`)
    }
  })
  
  return {
    title: '产品ROI里程碑分析',
    summary: `${products.length}个产品`,
    insights,
    trend: '无',
    alerts
  }
}

/**
 * 国家投放分析
 */
export function analyzeCountry(countries) {
  if (!countries || countries.length === 0) {
    return { title: '国家投放分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const insights = []
  let alerts = []
  
  // 按消耗排序
  const sorted = [...countries].sort((a, b) => (b.spend || 0) - (a.spend || 0))
  const top3 = sorted.slice(0, 3)
  
  // Top 3 国家
  top3.forEach((c, i) => {
    const roi = c.roi_d7 ? `${(c.roi_d7 * 100).toFixed(1)}%` : 'N/A'
    insights.push(`${i + 1}. ${c.country}: $${c.spend?.toFixed(0)} | D7 ROI ${roi}`)
  })
  
  // ROI 最优国家
  const validROI = countries.filter(c => c.roi_d7 !== null && c.roi_d7 > 0)
  if (validROI.length > 0) {
    const bestROI = validROI.reduce((best, c) => c.roi_d7 > best.roi_d7 ? c : best)
    insights.push(`ROI最优: ${bestROI.country} (${(bestROI.roi_d7 * 100).toFixed(1)}%)`)
  }
  
  // CPA 最优国家
  const validCPA = countries.filter(c => c.cpa !== null && c.cpa > 0)
  if (validCPA.length > 0) {
    const bestCPA = validCPA.reduce((best, c) => c.cpa < best.cpa ? c : best)
    insights.push(`CPA最优: ${bestCPA.country} ($${bestCPA.cpa.toFixed(2)})`)
  }
  
  // 预警：高消耗低ROI
  const highSpendLowROI = countries.filter(c => 
    c.spend > 1000 && c.roi_d7 !== null && c.roi_d7 < 0.07
  )
  if (highSpendLowROI.length > 0) {
    highSpendLowROI.forEach(c => {
      alerts.push(`${c.country} 高消耗($${c.spend.toFixed(0)})但D7 ROI仅${(c.roi_d7 * 100).toFixed(1)}%`)
    })
  }
  
  return {
    title: '国家投放分析',
    summary: `${countries.length}个国家投放，Top3: ${top3.map(c => c.country).join('/')}`,
    insights,
    trend: '无',
    alerts
  }
}

/**
 * ROI 预测分析洞察
 */
export function analyzeROIPrediction(predictions) {
  if (!predictions || predictions.length === 0) {
    return { title: 'ROI预测分析', summary: '暂无数据', insights: [], trend: '无' }
  }

  const valid = predictions.filter(p => p.prediction.confidence !== 'none')
  if (valid.length === 0) {
    return { title: 'ROI预测分析', summary: '数据不足，无法生成预测', insights: [], trend: '无' }
  }

  const insights = []
  const alerts = []

  // 最新一周预测
  const latest = valid[valid.length - 1]
  if (latest.prediction.predictD180 !== null) {
    const d180Pct = (latest.prediction.predictD180 * 100).toFixed(1)
    insights.push(`${latest.weekKey}: 预测 D180 ROI ${d180Pct}%`)
    if (latest.prediction.breakEvenDay) {
      insights.push(`  预计回本: D${latest.prediction.breakEvenDay}`)
    }
  }

  // 回本周统计
  const breakEvenWeeks = valid.filter(p => p.prediction.breakEvenDay !== null && p.prediction.breakEvenDay <= 180)
  const noBreakEven = valid.filter(p => p.prediction.predictD180 !== null && p.prediction.predictD180 < 1.5)

  if (breakEvenWeeks.length > 0) {
    insights.push(`\n${breakEvenWeeks.length}/${valid.length} 周预计 D180 前可回本`)
  }

  // 回本最快的 Top 3
  const sorted = [...breakEvenWeeks].sort((a, b) => (a.prediction.breakEvenDay || 999) - (b.prediction.breakEvenDay || 999))
  if (sorted.length > 0) {
    const top3 = sorted.slice(0, 3).map(p => `${p.weekKey}(D${p.prediction.breakEvenDay})`)
    insights.push(`回本最快: ${top3.join(', ')}`)
  }

  // 预警：预测 D180 < 150% 的周
  if (noBreakEven.length > 0) {
    noBreakEven.slice(-3).forEach(p => {
      alerts.push(`${p.weekKey} 预测 D180 仅 ${(p.prediction.predictD180 * 100).toFixed(0)}%，可能无法回本`)
    })
  }

  const summary = `共 ${valid.length} 周参与预测，${breakEvenWeeks.length} 周预计 D180 前可回本`

  return {
    title: 'ROI预测分析',
    summary,
    insights,
    trend: '无',
    alerts
  }
}

/**
 * ROI 波动因子拆解
 * 核心公式：ROI = LTV / CPI，用对数分解法量化 CPI 和 LTV 的贡献度
 * 进一步将 LTV 变动拆解为留存率、付费率、ARPPU 三因子
 */
export function analyzeROIDrivers(weeklyData) {
  if (!weeklyData || weeklyData.length < 2) {
    return null
  }

  // 找到最近两个有相同有效里程碑的周
  const milestones = [
    { day: 7, roiKey: 'roi_d7', ltvKey: 'ltv_d7', retKey: 'retention_d7' },
    { day: 1, roiKey: 'roi_d1', ltvKey: 'ltv_d1', retKey: 'retention_d1' },
    { day: 14, roiKey: 'roi_d14', ltvKey: 'ltv_d14', retKey: 'retention_d14' },
    { day: 30, roiKey: 'roi_d30', ltvKey: 'ltv_d30', retKey: 'retention_d30' }
  ]

  const insights = []
  const alerts = []

  for (const { day, roiKey, ltvKey, retKey } of milestones) {
    // 找最近两个有有效 ROI 数据的周
    const validWeeks = []
    for (let i = weeklyData.length - 1; i >= 0 && validWeeks.length < 2; i--) {
      const w = weeklyData[i]
      if (w[roiKey] !== null && w[roiKey] !== undefined && w[roiKey] > 0 && w.cpa > 0) {
        validWeeks.unshift(w)
      }
    }
    if (validWeeks.length < 2) continue

    const [prev, curr] = validWeeks
    const roiOld = prev[roiKey]
    const roiNew = curr[roiKey]
    const deltaROI = roiNew - roiOld
    const roiWoW = deltaROI / roiOld

    // 推算 LTV：ROI = LTV / CPI → LTV = ROI × CPI
    const ltvOld = roiOld * prev.cpa
    const ltvNew = roiNew * curr.cpa

    // 对数分解：ROI = LTV / CPI
    // ln(ROI_new/ROI_old) = ln(LTV_new/LTV_old) - ln(CPI_new/CPI_old)
    const lnROIRatio = Math.log(roiNew / roiOld)
    if (Math.abs(lnROIRatio) < 0.001) continue // 变化太小，跳过

    const lnLTVRatio = Math.log(ltvNew / ltvOld)
    const lnCPIRatio = Math.log(curr.cpa / prev.cpa)

    // 贡献度分配
    const ltvContribution = (lnLTVRatio / lnROIRatio) * deltaROI
    const cpiContribution = (-lnCPIRatio / lnROIRatio) * deltaROI

    const ltvContributionPct = (ltvContribution / roiOld) * 100
    const cpiContributionPct = (cpiContribution / roiOld) * 100

    insights.push(`—— D${day} ROI 动因分析 (${prev.weekKey} → ${curr.weekKey}) ——`)
    insights.push(`D${day} ROI 环比: ${roiWoW > 0 ? '+' : ''}${(roiWoW * 100).toFixed(1)}% [${(roiOld * 100).toFixed(1)}% → ${(roiNew * 100).toFixed(1)}%]`)
    insights.push(`  LTV 贡献: ${ltvContributionPct > 0 ? '↑' : '↓'}${Math.abs(ltvContributionPct).toFixed(1)}pp [$${ltvOld.toFixed(2)} → $${ltvNew.toFixed(2)}]`)
    insights.push(`  CPI 贡献: ${cpiContributionPct > 0 ? '↑' : '↓'}${Math.abs(cpiContributionPct).toFixed(1)}pp [$${prev.cpa.toFixed(2)} → $${curr.cpa.toFixed(2)}]`)

    // 进一步拆解 LTV 变动：留存率 × 付费率 × ARPPU
    const retOld = prev[retKey]
    const retNew = curr[retKey]
    const prOld = prev.avgPayingRate
    const prNew = curr.avgPayingRate
    const arppuOld = prev.avgArppu
    const arppuNew = curr.avgArppu

    if (retOld > 0 && retNew > 0 && prOld > 0 && prNew > 0 && arppuOld > 0 && arppuNew > 0) {
      // 简化拆解：LTV ≈ Retention × PayingRate × ARPPU × 系数
      // 用对数分解将 LTV 变化分配给三个因子
      const lnLTV = Math.log(ltvNew / ltvOld)
      if (Math.abs(lnLTV) > 0.001) {
        const lnRet = Math.log(retNew / retOld)
        const lnPR = Math.log(prNew / prOld)
        const lnARPPU = Math.log(arppuNew / arppuOld)
        const lnSum = Math.abs(lnRet) + Math.abs(lnPR) + Math.abs(lnARPPU)
        if (lnSum > 0.001) {
          const retShare = (Math.abs(lnRet) / lnSum) * ltvContribution
          const prShare = (Math.abs(lnPR) / lnSum) * ltvContribution
          const arppuShare = (Math.abs(lnARPPU) / lnSum) * ltvContribution

          const retDir = lnRet >= 0 ? '↑' : '↓'
          const prDir = lnPR >= 0 ? '↑' : '↓'
          const arppuDir = lnARPPU >= 0 ? '↑' : '↓'

          insights.push(`  留存率 D${day}: ${(retOld * 100).toFixed(1)}% → ${(retNew * 100).toFixed(1)}% ${retDir}贡献 ${retShare > 0 ? '+' : '-'}$${Math.abs(retShare).toFixed(2)}`)
          insights.push(`  付费率: ${(prOld * 100).toFixed(2)}% → ${(prNew * 100).toFixed(2)}% ${prDir}贡献 ${prShare > 0 ? '+' : '-'}$${Math.abs(prShare).toFixed(2)}`)
          insights.push(`  ARPPU: $${arppuOld.toFixed(2)} → $${arppuNew.toFixed(2)} ${arppuDir}贡献 ${arppuShare > 0 ? '+' : '-'}$${Math.abs(arppuShare).toFixed(2)}`)
        }
      }
    }

    // 预警
    if (cpiContributionPct < -5 && Math.abs(cpiContributionPct) > Math.abs(ltvContributionPct)) {
      alerts.push(`D${day} ROI 下降主要因 CPI 上涨($${prev.cpa.toFixed(2)}→$${curr.cpa.toFixed(2)})，建议优化获客成本`)
    }
    if (retOld > 0 && retNew > 0 && (retOld - retNew) > 0.05) {
      alerts.push(`D${day} 留存率下降${((retOld - retNew) * 100).toFixed(1)}pp，是 ROI 下滑的重要因素`)
    }

    const trend = roiWoW > 0.05 ? '上升' : roiWoW < -0.05 ? '下降' : '稳定'

    break // 只分析第一个有效里程碑
  }

  if (insights.length === 0) return null

  // 从 insights 提取摘要
  const summaryLine = insights.find(l => l.startsWith('D') && l.includes('环比')) || insights[0]

  return {
    title: 'ROI 动因分析',
    summary: summaryLine,
    trend: '无',
    insights,
    alerts
  }
}

/**
 * LTV 波动归因
 * 核心拆解：LTV_D7 = LTV_D1 + (D1→D7增量)
 * 将 LTV 变化归因为：首日价值变化 + 后续增长变化（留存改善 + 付费能力提升）
 */
export function analyzeLTVDrivers(weeklyData) {
  if (!weeklyData || weeklyData.length < 2) {
    return null
  }

  const milestones = [
    { day: 7, ltvKey: 'ltv_d7', ltv1Key: 'ltv_d1', retKey: 'retention_d7' },
    { day: 14, ltvKey: 'ltv_d14', ltv1Key: 'ltv_d1', retKey: 'retention_d14' },
    { day: 30, ltvKey: 'ltv_d30', ltv1Key: 'ltv_d1', retKey: 'retention_d30' }
  ]

  const insights = []
  const alerts = []

  for (const { day, ltvKey, ltv1Key, retKey } of milestones) {
    // 找最近两个有有效 LTV 数据的周
    const validWeeks = []
    for (let i = weeklyData.length - 1; i >= 0 && validWeeks.length < 2; i--) {
      const w = weeklyData[i]
      if (w[ltvKey] !== null && w[ltvKey] !== undefined && w[ltvKey] > 0) {
        validWeeks.unshift(w)
      }
    }
    if (validWeeks.length < 2) continue

    const [prev, curr] = validWeeks
    const ltvOld = prev[ltvKey]
    const ltvNew = curr[ltvKey]
    const deltaLTV = ltvNew - ltvOld
    const ltvWoW = deltaLTV / ltvOld

    insights.push(`—— D${day} LTV 动因分析 (${prev.weekKey} → ${curr.weekKey}) ——`)
    insights.push(`D${day} LTV 环比: ${ltvWoW > 0 ? '+' : ''}${(ltvWoW * 100).toFixed(1)}% [$${ltvOld.toFixed(2)} → $${ltvNew.toFixed(2)}]`)

    // 拆解：首日价值 + 后续增长
    const ltv1Old = prev[ltv1Key]
    const ltv1New = curr[ltv1Key]

    if (ltv1Old > 0 && ltv1New > 0) {
      const deltaFirstDay = ltv1New - ltv1Old
      const growthOld = ltvOld - ltv1Old  // D1→D7 增量
      const growthNew = ltvNew - ltv1New
      const deltaGrowth = growthNew - growthOld

      insights.push(`首日ARPU 贡献: ${deltaFirstDay > 0 ? '+' : ''}$${deltaFirstDay.toFixed(3)} [$${ltv1Old.toFixed(3)} → $${ltv1New.toFixed(3)}]`)
      insights.push(`D1→D${day}增长贡献: ${deltaGrowth > 0 ? '+' : ''}$${deltaGrowth.toFixed(3)} [$${growthOld.toFixed(3)} → $${growthNew.toFixed(3)}]`)

      // 进一步拆解后续增长：留存 vs 付费
      const retOld = prev[retKey]
      const retNew = curr[retKey]
      const arppuOld = prev.avgArppu
      const arppuNew = curr.avgArppu

      if (retOld > 0 && retNew > 0 && arppuOld > 0 && arppuNew > 0) {
        // 简化模型：后续增长 ≈ 留存率 × ARPPU × 系数
        // 用对数分解
        if (growthOld > 0 && growthNew > 0) {
          const lnGrowth = Math.log(growthNew / growthOld)
          if (Math.abs(lnGrowth) > 0.001) {
            const lnRet = Math.log(retNew / retOld)
            const lnARPPU = Math.log(arppuNew / arppuOld)
            const lnSum = Math.abs(lnRet) + Math.abs(lnARPPU)

            if (lnSum > 0.001) {
              const retShare = (Math.abs(lnRet) / lnSum) * deltaGrowth
              const arppuShare = (Math.abs(lnARPPU) / lnSum) * deltaGrowth

              const retDir = lnRet >= 0 ? '↑' : '↓'
              const arppuDir = lnARPPU >= 0 ? '↑' : '↓'

              insights.push(`  留存改善贡献: ${retShare > 0 ? '+' : '-'}$${Math.abs(retShare).toFixed(3)} (D${day}留存 ${(retOld * 100).toFixed(1)}% → ${(retNew * 100).toFixed(1)}% ${retDir})`)
              insights.push(`  ARPPU 提升贡献: ${arppuShare > 0 ? '+' : '-'}$${Math.abs(arppuShare).toFixed(3)} ($${arppuOld.toFixed(2)} → $${arppuNew.toFixed(2)} ${arppuDir})`)
            }
          }
        }
      }
    } else {
      // D1 LTV 不可用，仅显示总体变化
      insights.push(`总变化: ${deltaLTV > 0 ? '+' : ''}$${deltaLTV.toFixed(3)}`)
    }

    // 预警
    if (ltvWoW < -0.1) {
      alerts.push(`D${day} LTV 环比下降${(Math.abs(ltvWoW) * 100).toFixed(0)}%，用户价值下滑明显`)
    }

    break // 只分析第一个有效里程碑
  }

  if (insights.length === 0) return null

  const summaryLine = insights.find(l => l.startsWith('D') && l.includes('环比')) || insights[0]

  return {
    title: 'LTV 动因分析',
    summary: summaryLine,
    trend: '无',
    insights,
    alerts
  }
}
