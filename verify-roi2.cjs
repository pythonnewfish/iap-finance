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

const colIdx = {}
headers.forEach((h, i) => { colIdx[h] = i })

console.log('=== 7日ROI 原始值抽样 ===')
console.log('列名:', headers[colIdx['7日ROI']])
console.log('列索引:', colIdx['7日ROI'])

// 打印前20行数据行的7日ROI原始值
for (let r = headerIdx + 1; r < Math.min(headerIdx + 21, json.length); r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const dateVal = row[colIdx['日期']]
  const media = row[colIdx['媒体']]
  const country = row[colIdx['国家']]
  const newUsers = row[colIdx['新增用户']]
  const spend = row[colIdx['消耗($)']]
  const roiD7 = row[colIdx['7日ROI']]
  console.log(`  日期:${dateVal} | 媒体:${media} | 国家:${country} | 新增:${newUsers} | 消耗:${spend} | 7日ROI原始值:${roiD7} (type:${typeof roiD7})`)
}

// 也检查总收入和LTV
console.log('\n=== 相关字段抽样 ===')
const fieldsToCheck = ['总收入($)', '新增 arpu', 'LTV7', '首日ROI']
fieldsToCheck.forEach(f => {
  console.log(`${f} 列索引: ${colIdx[f] !== undefined ? colIdx[f] : 'NOT FOUND'}`)
})

console.log('\n--- 抽样 ---')
for (let r = headerIdx + 1; r < Math.min(headerIdx + 6, json.length); r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const totalRev = row[colIdx['总收入($)']]
  const newArpu = row[colIdx['新增 arpu']]
  const ltv7 = row[colIdx['LTV7']]
  const roiD1 = row[colIdx['首日ROI']]
  const roiD7 = row[colIdx['7日ROI']]
  const spend = row[colIdx['消耗($)']]
  const newUsers = row[colIdx['新增用户']]
  console.log(`  总收入:${totalRev}(${typeof totalRev}) | 新增arpu:${newArpu}(${typeof newArpu}) | LTV7:${ltv7}(${typeof ltv7}) | 首日ROI:${roiD1}(${typeof roiD1}) | 7日ROI:${roiD7}(${typeof roiD7}) | 消耗:${spend} | 新增:${newUsers}`)
}
