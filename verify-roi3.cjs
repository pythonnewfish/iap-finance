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

// 检查6月8日的数据（应该有7天的D7数据）
console.log('=== 6月8日(星期一) 的 7日ROI ===')
let count = 0
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const dateVal = String(row[colIdx['日期']])
  if (!dateVal.includes('2026-06-08')) continue
  
  const media = row[colIdx['媒体']]
  if (media === '自然量' || !media) continue
  
  count++
  const country = row[colIdx['国家']]
  const newUsers = row[colIdx['新增用户']]
  const spend = row[colIdx['消耗($)']]
  const roiD1 = row[colIdx['首日ROI']]
  const roiD7 = row[colIdx['7日ROI']]
  const ltv7 = row[colIdx['LTV7']]
  const newArpu = row[colIdx['新增 arpu']]
  
  if (count <= 20) {
    console.log(`  ${media} | ${country} | 新增:${newUsers} | 消耗:${spend} | D1ROI:${roiD1} | D7ROI:${roiD7} | LTV7:${ltv7} | 新增arpu:${newArpu}`)
  }
}
console.log(`6月8日总行数(付费): ${count}`)

// 也检查6月2日（W23的第一天）
console.log('\n=== 6月2日(星期一) 的 7日ROI ===')
let count2 = 0
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const dateVal = String(row[colIdx['日期']])
  if (!dateVal.includes('2026-06-02')) continue
  
  const media = row[colIdx['媒体']]
  if (media === '自然量' || !media) continue
  
  count2++
  const country = row[colIdx['国家']]
  const newUsers = row[colIdx['新增用户']]
  const spend = row[colIdx['消耗($)']]
  const roiD1 = row[colIdx['首日ROI']]
  const roiD7 = row[colIdx['7日ROI']]
  const ltv7 = row[colIdx['LTV7']]
  
  if (count2 <= 20) {
    console.log(`  ${media} | ${country} | 新增:${newUsers} | 消耗:${spend} | D1ROI:${roiD1} | D7ROI:${roiD7} | LTV7:${ltv7}`)
  }
}
console.log(`6月2日总行数(付费): ${count2}`)

// 看看日期范围
console.log('\n=== 所有日期分布 ===')
const dateCounts = {}
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const media = row[colIdx['媒体']]
  if (media === '自然量' || !media) continue
  const dateVal = String(row[colIdx['日期']]).replace(/\(.*\)/, '')
  dateCounts[dateVal] = (dateCounts[dateVal] || 0) + 1
}
Object.entries(dateCounts).sort().forEach(([d, c]) => console.log(`  ${d}: ${c} 行`))
