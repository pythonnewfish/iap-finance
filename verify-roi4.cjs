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

function parsePct(val) {
  if (typeof val === 'number') return val / 100
  if (typeof val === 'string' && val.includes('%')) return parseFloat(val.replace('%','')) / 100
  return 0
}
function parseNum(val) {
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val.replace(/,/g,'')) || 0
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

// 收集W23数据
const week23Rows = []
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  
  const dateStr = String(row[colIdx['日期']]).replace(/\(.*\)/, '')
  const media = row[colIdx['媒体']] !== undefined ? String(row[colIdx['媒体']]).trim() : ''
  if (media === '自然量' || media === '') continue
  
  const weekInfo = getISOWeek(dateStr)
  if (weekInfo.week !== 23 || weekInfo.year !== 2026) continue
  
  const newUsers = parseNum(row[colIdx['新增用户']])
  const spend = parseNum(row[colIdx['消耗($)']])
  const roiD7Str = row[colIdx['7日ROI']]
  const roiD7 = roiD7Str !== undefined ? parsePct(roiD7Str) : null
  
  week23Rows.push({ date: dateStr, media, newUsers, spend, roiD7, roiD7Str })
}

console.log(`W23 总行数: ${week23Rows.length}`)

// 按日期统计D7 ROI
const byDate = {}
week23Rows.forEach(r => {
  if (!byDate[r.date]) byDate[r.date] = []
  byDate[r.date].push(r)
})

Object.entries(byDate).sort().forEach(([date, rows]) => {
  const nonZero = rows.filter(r => r.roiD7 > 0)
  const zeroD7 = rows.filter(r => r.roiD7 === 0)
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalSpendNZ = nonZero.reduce((s, r) => s + r.spend, 0)
  console.log(`  ${date}: ${rows.length}行, D7=0:${zeroD7.length}行, D7>0:${nonZero.length}行, 消耗:${totalSpend.toFixed(0)}, 非零消耗:${totalSpendNZ.toFixed(0)}`)
})

// 方法5: 剔除D7ROI=0的行，按消耗加权
const nonZeroRows = week23Rows.filter(r => r.roiD7 > 0)
const totalSpend5 = nonZeroRows.reduce((s, r) => s + r.spend, 0)
const weightedSum5 = nonZeroRows.reduce((s, r) => s + r.roiD7 * r.spend, 0)
const result5 = totalSpend5 > 0 ? weightedSum5 / totalSpend5 : 0
console.log(`\n方法5 (剔除D7=0, 按消耗加权): ${(result5 * 100).toFixed(2)}%`)
console.log(`  行数: ${nonZeroRows.length}, 消耗: ${totalSpend5.toFixed(2)}`)

// 方法6: 剔除D7ROI=0的行，按新增用户加权
const totalNewUsers6 = nonZeroRows.reduce((s, r) => s + r.newUsers, 0)
const weightedSum6 = nonZeroRows.reduce((s, r) => s + r.roiD7 * r.newUsers, 0)
const result6 = totalNewUsers6 > 0 ? weightedSum6 / totalNewUsers6 : 0
console.log(`\n方法6 (剔除D7=0, 按新增用户加权): ${(result6 * 100).toFixed(2)}%`)
console.log(`  行数: ${nonZeroRows.length}, 新增用户: ${totalNewUsers6}`)

// 方法7: 所有行(含0)，按消耗加权
const totalSpend7 = week23Rows.reduce((s, r) => s + r.spend, 0)
const weightedSum7 = week23Rows.reduce((s, r) => s + r.roiD7 * r.spend, 0)
const result7 = totalSpend7 > 0 ? weightedSum7 / totalSpend7 : 0
console.log(`\n方法7 (含D7=0, 按消耗加权): ${(result7 * 100).toFixed(2)}%`)

// 方法8: 简单算术平均(剔除0)
const avgROI = nonZeroRows.reduce((s, r) => s + r.roiD7, 0) / nonZeroRows.length
console.log(`\n方法8 (剔除D7=0, 简单平均): ${(avgROI * 100).toFixed(2)}%`)
