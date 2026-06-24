const XLSX = require('xlsx')

const filePath = '/Users/small/Downloads/广告ROI报表-海外iap20260615110839.xlsx'
const wb = XLSX.readFile(filePath)
const ws = wb.Sheets[wb.SheetNames[0]]
const json = XLSX.utils.sheet_to_json(ws, { header: 1 })

// 找表头行
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

console.log('表头行:', headerIdx)
const colIdx = {}
headers.forEach((h, i) => { colIdx[h] = i })

// 解析日期
function parseDate(val) {
  if (typeof val === 'number') {
    // Excel序列号
    const d = new Date((val - 25569) * 86400 * 1000)
    return d.toISOString().split('T')[0]
  }
  return String(val)
}

// 解析百分比
function parsePct(val) {
  if (typeof val === 'number') return val / 100
  if (typeof val === 'string' && val.includes('%')) return parseFloat(val.replace('%','')) / 100
  return 0
}

// 解析数字
function parseNum(val) {
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val.replace(/,/g,'')) || 0
  return 0
}

// 获取ISO周
function getISOWeek(dateStr) {
  const d = new Date(dateStr)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

// 导出日期
const exportDate = new Date('2026-06-15')

// 收集23周的数据
const week23Rows = []

for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  
  const dateStr = parseDate(row[colIdx['日期']])
  const media = row[colIdx['媒体']] !== undefined ? String(row[colIdx['媒体']]).trim() : ''
  
  // 跳过自然量
  if (media === '自然量' || media === '') continue
  
  const weekInfo = getISOWeek(dateStr)
  if (weekInfo.week !== 23) continue
  
  const newUsers = parseNum(row[colIdx['新增用户']])
  const spend = parseNum(row[colIdx['消耗($)']])
  const roiD7Raw = row[colIdx['7日ROI']]
  const roiD7 = roiD7Raw !== undefined ? parsePct(roiD7Raw) : null
  
  // 计算maxDays
  const dataDate = new Date(dateStr)
  const maxDays = Math.floor((exportDate - dataDate) / (86400 * 1000))
  
  week23Rows.push({
    date: dateStr,
    media,
    country: row[colIdx['国家']],
    appName: row[colIdx['应用名称']],
    newUsers,
    spend,
    roiD7,
    roiD7Raw: roiD7Raw !== undefined ? parseNum(roiD7Raw) : null,
    maxDays,
    hasD7: maxDays >= 7
  })
}

console.log(`\n23周总行数: ${week23Rows.length}`)
console.log(`hasD7=true: ${week23Rows.filter(r => r.hasD7).length}`)
console.log(`hasD7=false: ${week23Rows.filter(r => !r.hasD7).length}`)

// 方法1: 当前代码的加权平均 (按新增用户加权)
const complete1 = week23Rows.filter(r => r.hasD7 && r.roiD7 !== null)
const totalNewUsers = complete1.reduce((s, r) => s + r.newUsers, 0)
const weightedSum1 = complete1.reduce((s, r) => s + r.roiD7 * r.newUsers, 0)
const result1 = totalNewUsers > 0 ? weightedSum1 / totalNewUsers : 0
console.log(`\n方法1 (当前-按新增用户加权): ${(result1 * 100).toFixed(2)}%`)
console.log(`  参与计算行数: ${complete1.length}, 总新增用户: ${totalNewUsers}`)

// 方法2: 按消耗加权 (= sum(D7 revenue) / sum(spend))
const complete2 = week23Rows.filter(r => r.hasD7 && r.roiD7 !== null)
const totalSpend = complete2.reduce((s, r) => s + r.spend, 0)
const weightedSum2 = complete2.reduce((s, r) => s + r.roiD7 * r.spend, 0)
const result2 = totalSpend > 0 ? weightedSum2 / totalSpend : 0
console.log(`\n方法2 (按消耗加权=sum(D7收入)/sum(消耗)): ${(result2 * 100).toFixed(2)}%`)
console.log(`  总消耗: ${totalSpend.toFixed(2)}`)

// 方法3: 不过滤hasD7，按新增用户加权
const complete3 = week23Rows.filter(r => r.roiD7 !== null)
const totalNewUsers3 = complete3.reduce((s, r) => s + r.newUsers, 0)
const weightedSum3 = complete3.reduce((s, r) => s + r.roiD7 * r.newUsers, 0)
const result3 = totalNewUsers3 > 0 ? weightedSum3 / totalNewUsers3 : 0
console.log(`\n方法3 (不过滤hasD7，按新增用户加权): ${(result3 * 100).toFixed(2)}%`)
console.log(`  行数: ${complete3.length}`)

// 方法4: 不过滤hasD7，按消耗加权
const complete4 = week23Rows.filter(r => r.roiD7 !== null)
const totalSpend4 = complete4.reduce((s, r) => s + r.spend, 0)
const weightedSum4 = complete4.reduce((s, r) => s + r.roiD7 * r.spend, 0)
const result4 = totalSpend4 > 0 ? weightedSum4 / totalSpend4 : 0
console.log(`\n方法4 (不过滤hasD7，按消耗加权): ${(result4 * 100).toFixed(2)}%`)

// 打印部分明细
console.log(`\n--- 23周 hasD7=true 的前10行明细 ---`)
complete1.slice(0, 10).forEach((r, i) => {
  console.log(`  ${i+1}. ${r.date} | ${r.media} | ${r.country} | ${r.appName} | 新增:${r.newUsers} | 消耗:${r.spend.toFixed(2)} | D7ROI:${(r.roiD7*100).toFixed(2)}% | maxDays:${r.maxDays}`)
})
