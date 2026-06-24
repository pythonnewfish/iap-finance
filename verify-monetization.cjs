const XLSX = require('xlsx')

const filePath = '/Users/small/Downloads/广告ROI报表-海外iap20260615110839.xlsx'
const wb = XLSX.readFile(filePath)
const ws = wb.Sheets[wb.SheetNames[0]]
const json = XLSX.utils.sheet_to_json(ws, { header: 1 })

let headerIdx = -1
for (let r = 0; r < Math.min(20, json.length); r++) {
  if (json[r] && json[r].some(c => String(c).trim() === '日期')) {
    headerIdx = r
    break
  }
}

const headers = json[headerIdx].map(h => {
  let s = String(h).trim()
  s = s.replace(/(\d)\s+(日)/g, '$1$2')
  return s
})

const colIdx = {}
headers.forEach((h, i) => { colIdx[h] = i })

console.log('=== 付费相关字段 ===')
console.log('付费率:', colIdx['付费率'] !== undefined ? `列${colIdx['付费率']}` : 'NOT FOUND')
console.log('付费arppu:', colIdx['付费arppu'] !== undefined ? `列${colIdx['付费arppu']}` : 'NOT FOUND')
console.log('活跃用户数:', colIdx['活跃用户数'] !== undefined ? `列${colIdx['活跃用户数']}` : 'NOT FOUND')
console.log('新增用户:', colIdx['新增用户'] !== undefined ? `列${colIdx['新增用户']}` : 'NOT FOUND')

function parseNum(val) {
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0
  return 0
}
function parsePct(val) {
  if (typeof val === 'number') return val / 100
  if (typeof val === 'string' && val.includes('%')) return parseFloat(val.replace('%', '')) / 100
  return 0
}
function getISOWeek(dateStr) {
  const d = new Date(dateStr)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

// 收集W22数据(选一个完整的周)
const week22Rows = []
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  
  const dateStr = String(row[colIdx['日期']]).replace(/\(.*\)/, '')
  const media = row[colIdx['媒体']] !== undefined ? String(row[colIdx['媒体']]).trim() : ''
  if (media === '自然量' || media === '') continue
  
  const weekInfo = getISOWeek(dateStr)
  if (weekInfo.week !== 22 || weekInfo.year !== 2026) continue
  
  const newUsers = parseNum(row[colIdx['新增用户']])
  const activeUsers = parseNum(row[colIdx['活跃用户数']])
  const payingRate = row[colIdx['付费率']] !== undefined ? parsePct(row[colIdx['付费率']]) : null
  const arppu = row[colIdx['付费arppu']] !== undefined ? parseNum(row[colIdx['付费arppu']]) : null
  
  week22Rows.push({ newUsers, activeUsers, payingRate, arppu })
}

console.log(`\nW22 付费渠道行数: ${week22Rows.length}`)

// 方法1: 简单平均（当前代码）
const validPR = week22Rows.filter(r => r.payingRate !== null && r.payingRate > 0)
const simpleAvgPR = validPR.reduce((s, r) => s + r.payingRate, 0) / validPR.length
const validARPPU = week22Rows.filter(r => r.arppu !== null && r.arppu > 0)
const simpleAvgARPPU = validARPPU.reduce((s, r) => s + r.arppu, 0) / validARPPU.length
console.log(`\n方法1 (简单平均):`)
console.log(`  付费率: ${(simpleAvgPR * 100).toFixed(4)}%`)
console.log(`  ARPPU: $${simpleAvgARPPU.toFixed(2)}`)

// 方法2: 按新增用户加权
const totalNewUsers2 = validPR.reduce((s, r) => s + r.newUsers, 0)
const weightedPR2 = validPR.reduce((s, r) => s + r.payingRate * r.newUsers, 0) / totalNewUsers2
const totalNewUsers3 = validARPPU.reduce((s, r) => s + r.newUsers, 0)
const weightedARPPU2 = validARPPU.reduce((s, r) => s + r.arppu * r.newUsers, 0) / totalNewUsers3
console.log(`\n方法2 (按新增用户加权):`)
console.log(`  付费率: ${(weightedPR2 * 100).toFixed(4)}%`)
console.log(`  ARPPU: $${weightedARPPU2.toFixed(2)}`)

// 方法3: 按活跃用户加权
const totalActiveUsers = validPR.reduce((s, r) => s + r.activeUsers, 0)
const weightedPR3 = validPR.reduce((s, r) => s + r.payingRate * r.activeUsers, 0) / totalActiveUsers
const totalActiveUsers2 = validARPPU.reduce((s, r) => s + r.activeUsers, 0)
const weightedARPPU3 = validARPPU.reduce((s, r) => s + r.arppu * r.activeUsers, 0) / totalActiveUsers2
console.log(`\n方法3 (按活跃用户加权):`)
console.log(`  付费率: ${(weightedPR3 * 100).toFixed(4)}%`)
console.log(`  ARPPU: $${weightedARPPU3.toFixed(2)}`)

// 打印前5行数据看看字段值
console.log(`\n--- W22 前5行明细 ---`)
week22Rows.slice(0, 5).forEach((r, i) => {
  console.log(`  ${i+1}. 新增:${r.newUsers} | 活跃:${r.activeUsers} | 付费率:${(r.payingRate*100).toFixed(2)}% | ARPPU:$${r.arppu?.toFixed(2)}`)
})
