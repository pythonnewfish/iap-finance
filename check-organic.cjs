const XLSX = require('xlsx')

const filePath = '/Users/small/Downloads/广告ROI报表-海外iap20260613140613.xlsx'
const wb = XLSX.readFile(filePath)
const ws = wb.Sheets[wb.SheetNames[0]]
const json = XLSX.utils.sheet_to_json(ws, { header: 1 })

// 找到表头行
let headerIdx = -1
for (let r = 0; r < Math.min(20, json.length); r++) {
  if (json[r] && json[r].some(c => String(c).trim() === '日期')) {
    headerIdx = r
    break
  }
}

const headers = json[headerIdx].map(h => String(h).trim())
const mediaIdx = headers.indexOf('媒体')
const adGroupIdIdx = headers.indexOf('广告组ID')
const adGroupNameIdx = headers.indexOf('广告组名称')

console.log(`表头行: ${headerIdx}`)
console.log(`媒体列索引: ${mediaIdx}`)
console.log(`广告组ID列索引: ${adGroupIdIdx}`)
console.log(`广告组名称列索引: ${adGroupNameIdx}`)

// 统计媒体字段的所有唯一值
const mediaValues = {}
let totalRows = 0

for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  totalRows++
  
  const media = row[mediaIdx] !== undefined ? String(row[mediaIdx]).trim() : '(空)'
  mediaValues[media] = (mediaValues[media] || 0) + 1
}

console.log(`\n总数据行数: ${totalRows}`)
console.log(`\n媒体字段分布:`)
Object.entries(mediaValues)
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => {
    console.log(`  "${key}": ${count} 行 (${(count/totalRows*100).toFixed(1)}%)`)
  })

// 检查空广告组ID的行
let emptyAdGroupCount = 0
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r]
  if (!row || row.every(c => c === undefined || c === null || c === '')) continue
  const adGroupId = row[adGroupIdIdx]
  if (adGroupId === undefined || adGroupId === null || String(adGroupId).trim() === '') {
    emptyAdGroupCount++
  }
}
console.log(`\n广告组ID为空的行数: ${emptyAdGroupCount}`)
