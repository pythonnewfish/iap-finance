/**
 * ROI 预测服务
 * 基于幂律模型的纯数据拟合预测
 * 
 * 模型: ROI(t) = a × t^β
 * 对数空间: log(ROI) = log(a) + β × log(t)
 * 
 * 特点:
 * - 使用 D1-D30 每日数据 + D36 起里程碑数据，提高拟合精度
 * - 单调性异常值剔除（ROI应单调递增）
 * - 全局参考模型：汇集历史所有周的ROI数据拟合全局增长曲线
 * - 外推时使用全局模型的曲线形状，按当前周实际数据等比缩放
 */

// 所有可用里程碑天数（D1-D30每日 + 后续里程碑）
const ALL_DAYS = [
  ...Array.from({ length: 30 }, (_, i) => i + 1),
  36, 42, 48, 54, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360
]

// 回本线 ROI = 150%
const BREAK_EVEN_ROI = 1.5

/**
 * 从 weeklyData 某周中提取非 null 的 ROI 观测点
 */
export function extractObservations(weekItem) {
  const obs = []
  ALL_DAYS.forEach(day => {
    const roi = weekItem[`roi_d${day}`]
    if (roi !== null && roi !== undefined && roi > 0) {
      obs.push({ day, roi })
    }
  })
  return obs
}

/**
 * 单调性异常值剔除
 * ROI 应随天数单调递增，低于前一个有效值则视为异常剔除
 */
function removeOutliers(observations) {
  if (observations.length < 2) return observations
  const sorted = [...observations].sort((a, b) => a.day - b.day)
  const clean = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = clean[clean.length - 1]
    if (sorted[i].roi >= prev.roi) {
      clean.push(sorted[i])
    }
  }
  return clean
}

/**
 * 对数空间线性回归
 */
function logLinearRegression(points) {
  const n = points.length
  if (n < 2) return null
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  points.forEach(({ x, y }) => {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })
  
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null
  
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  
  const meanY = sumY / n
  let ssRes = 0, ssTot = 0
  points.forEach(({ x, y }) => {
    const predicted = slope * x + intercept
    ssRes += (y - predicted) ** 2
    ssTot += (y - meanY) ** 2
  })
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
  
  return { slope, intercept, r2 }
}

/**
 * 构建全局参考模型
 * 汇集所有周的历史ROI数据，归一化后拟合全局幂律曲线
 * 
 * 归一化策略：每周数据除以该周D30的ROI值，得到相对增长倍数
 * 然后对所有归一化后的点做 log-log 线性回归
 */
function buildGlobalModel(allWeekObservations) {
  // 1. 收集有D30数据的周，计算D30基准值
  const normalizedPoints = [] // {day, normalizedRoi}
  
  allWeekObservations.forEach(obs => {
    if (obs.length < 3) return
    const d30Point = obs.find(o => o.day === 30)
    if (!d30Point || d30Point.roi <= 0) return
    
    const base = d30Point.roi
    obs.forEach(o => {
      normalizedPoints.push({
        day: o.day,
        roi: o.roi / base  // 相对D30的增长倍数
      })
    })
  })
  
  if (normalizedPoints.length < 5) return null
  
  // 2. 对归一化数据做 log-log 线性回归
  const logPoints = normalizedPoints.map(p => ({
    x: Math.log(p.day),
    y: Math.log(p.roi)
  }))
  
  const fit = logLinearRegression(logPoints)
  if (!fit || fit.slope <= 0) return null
  
  const a = Math.exp(fit.intercept)
  const beta = fit.slope
  
  return {
    a,
    beta,
    r2: fit.r2,
    nPoints: normalizedPoints.length,
    predictAt: (day) => {
      if (day <= 0) return 0
      return a * Math.pow(day, beta)
    }
  }
}

/**
 * 对单周进行幂律拟合
 * @param {Array<{day: number, roi: number}>} observations - 观测点
 * @param {Object|null} globalModel - 全局参考模型
 * @returns {Object} 拟合结果
 */
export function fitWeekCohort(observations, globalModel = null) {
  if (!observations || observations.length < 2) {
    if (globalModel && observations?.length >= 1) {
      return buildMultiplierResult(globalModel, observations, 'multiplier')
    }
    return {
      confidence: 'none', predictAt: () => null, predictD180: null,
      breakEvenDay: null, r2: 0, nPoints: observations?.length || 0
    }
  }
  
  const cleanObs = removeOutliers(observations)
  const n = cleanObs.length
  
  if (n < 2) {
    if (globalModel) {
      return buildMultiplierResult(globalModel, observations, 'multiplier')
    }
    return { confidence: 'none', predictAt: () => null, predictD180: null, breakEvenDay: null, r2: 0, nPoints: observations.length }
  }
  
  // 已实测D180：直接返回实测值
  const hasActual180 = cleanObs.some(o => o.day === 180)
  if (hasActual180) {
    const logPoints = cleanObs.map(o => ({ x: Math.log(o.day), y: Math.log(o.roi) }))
    const fit = logLinearRegression(logPoints)
    if (fit && fit.slope > 0) {
      const result = buildResultFromParams(Math.exp(fit.intercept), fit.slope, cleanObs)
      return { ...result, r2: fit.r2, nPoints: observations.length, cleanPoints: n, confidence: 'actual' }
    }
  }
  
  // 有全局模型：一律使用倍率法（借用全局模型的曲线形状）
  if (globalModel) {
    return buildMultiplierResult(globalModel, cleanObs, 'multiplier')
  }
  
  // 无全局模型：兑底纯数据拟合
  const logPoints = cleanObs.map(o => ({ x: Math.log(o.day), y: Math.log(o.roi) }))
  const fit = logLinearRegression(logPoints)
  if (!fit) {
    return { confidence: 'none', predictAt: () => null, predictD180: null, breakEvenDay: null, r2: 0, nPoints: n }
  }
  
  let beta = fit.slope
  if (beta <= 0) beta = 0.01
  const a = Math.exp(fit.intercept)
  const result = buildResultFromParams(a, beta, cleanObs)
  
  let confidence = 'low'
  if (n >= 10 && fit.r2 >= 0.90) confidence = 'high'
  else if (n >= 5 && fit.r2 >= 0.70) confidence = 'medium'
  
  return { ...result, r2: fit.r2, nPoints: observations.length, cleanPoints: n, confidence }
}

/**
 * 用全局模型的曲线形状预估当前周ROI
 * 缩放因子 = 当前周锚点 ROI / 全局模型在锚点的预测值
 * 预测 = 全局模型曲线 × 缩放因子
 */
function buildMultiplierResult(globalModel, observations, confidence) {
  if (!observations || observations.length === 0) {
    return { confidence: 'none', predictAt: () => null, predictD180: null, breakEvenDay: null, r2: 0, nPoints: 0 }
  }
  
  const sorted = [...observations].sort((a, b) => a.day - b.day)
  const anchor = sorted[sorted.length - 1] // 最远的观测点作为锚点
  
  const refPredictAnchor = globalModel.predictAt(anchor.day)
  const refPredict180 = globalModel.predictAt(180)
  
  // 缩放因子：当前周锚点 ROI / 全局模型在锚点的预测值
  const scale = refPredictAnchor > 0 ? anchor.roi / refPredictAnchor : 1
  const predictD180 = refPredict180 * scale
  
  // 预测函数：始终使用全局模型的幂律曲线，按当前周实际ROI等比缩放
  const predictAt = (day) => {
    if (day <= 0) return 0
    // 观测点直接返回实际值
    const obsPoint = sorted.find(o => o.day === day)
    if (obsPoint) return obsPoint.roi
    // 其余天数用全局模型曲线 × 缩放因子
    return globalModel.predictAt(day) * scale
  }
  
  // 回本日预测
  let breakEvenDay = null
  const alreadyBreakEven = sorted.some(o => o.roi >= BREAK_EVEN_ROI)
  if (alreadyBreakEven) {
    const breakEvenObs = sorted.find(o => o.roi >= BREAK_EVEN_ROI)
    if (breakEvenObs) breakEvenDay = breakEvenObs.day
  } else if (predictD180 >= BREAK_EVEN_ROI || predictAt(1000) >= BREAK_EVEN_ROI) {
    // 二分搜索回本日（扩展至D1000）
    let lo = anchor.day, hi = 1000
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2)
      if (predictAt(mid) >= BREAK_EVEN_ROI) hi = mid
      else lo = mid
    }
    breakEvenDay = hi
  }
  
  return {
    a: globalModel.a,
    beta: globalModel.beta,
    multiplier: Math.round((refPredictAnchor > 0 ? refPredict180 / refPredictAnchor : 1) * 100) / 100,
    anchorDay: anchor.day,
    anchorROI: anchor.roi,
    predictAt,
    predictD180,
    breakEvenDay,
    r2: globalModel.r2 || 0,
    nPoints: observations.length,
    confidence
  }
}

/**
 * 从模型参数构建预测结果
 */
function buildResultFromParams(a, beta, observations) {
  const predictAt = (day) => {
    if (day <= 0) return 0
    return a * Math.pow(day, beta)
  }
  
  const predictD180 = predictAt(180)
  
  let breakEvenDay = null
  const alreadyBreakEven = observations.some(o => o.roi >= BREAK_EVEN_ROI)
  if (alreadyBreakEven) {
    const breakEvenObs = observations.find(o => o.roi >= BREAK_EVEN_ROI)
    if (breakEvenObs) breakEvenDay = breakEvenObs.day
  } else {
    const t = Math.pow(BREAK_EVEN_ROI / a, 1 / beta)
    if (t > 0 && isFinite(t)) {
      breakEvenDay = Math.ceil(t)
    }
  }
  
  const hasActual180 = observations.some(o => o.day === 180)
  
  return {
    a,
    beta,
    predictAt,
    predictD180: hasActual180 ? observations.find(o => o.day === 180)?.roi || predictD180 : predictD180,
    breakEvenDay
  }
}

/**
 * 批量预测所有周
 * 先汇集所有周数据构建全局参考模型，再对每周进行预测
 */
export function predictAllWeeks(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) return []
  
  // 1. 提取并清洗所有周的观测数据
  const allCleanObs = weeklyData.map(w => removeOutliers(extractObservations(w)))
  
  // 2. 用所有历史数据构建全局参考模型
  const globalModel = buildGlobalModel(allCleanObs)
  
  // 3. 对每周应用预测
  return weeklyData.map((w, i) => {
    const observations = extractObservations(w)
    const cleanObs = allCleanObs[i]
    const prediction = fitWeekCohort(observations, globalModel)
    return { weekKey: w.weekKey, observations: cleanObs, rawObservations: observations, prediction }
  })
}
