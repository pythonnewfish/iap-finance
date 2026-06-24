import XLSX from 'xlsx'

const filePath = process.argv[2]
if (!filePath) {
  console.log('Usage: node inspect-excel.mjs <file>')
  process.exit(1)
}

const wb = XLSX.readFile(filePath)

console.log('=== Sheet信息 ===')
console.log('Sheet数量:', wb.SheetNames.length)
console.log('Sheet名称:', wb.SheetNames)

wb.SheetNames.forEach((name, i) => {
  const ws = wb.Sheets[name]
  const json = XLSX.utils.sheet_to_json(ws, { header: 1 })
  console.log(`\n--- Sheet ${i}: "${name}" ---`)
  console.log('行数:', json.length)
  
  if (json.length > 0) {
    console.log('表头(前10个):', json[0].slice(0, 10))
    console.log('表头总数:', json[0].length)
    
    if (json.length > 1) {
      console.log('第一行数据(前10个值):')
      json[0].slice(0, 10).forEach((header, idx) => {
        const val = json[1][idx]
        console.log(`  "${header}" => ${JSON.stringify(val)} (类型: ${typeof val})`)
      })
    }
  }
})
