const XLSX = require('xlsx')

const filePath = process.argv[2]
if (!filePath) {
  console.log('Usage: node inspect-excel.cjs <file>')
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
  console.log('总行数:', json.length)
  
  // 显示前5行
  console.log('\n前5行:')
  for (let r = 0; r < Math.min(5, json.length); r++) {
    const row = json[r]
    if (row && row.length > 0) {
      console.log(`  行${r}: [${row.length}列] 前5个值:`, row.slice(0, 5))
    }
  }
  
  // 查找实际的表头行（有"日期"字段的行）
  let headerRowIdx = -1
  for (let r = 0; r < Math.min(20, json.length); r++) {
    const row = json[r]
    if (row && row.some(cell => String(cell).includes('日期'))) {
      headerRowIdx = r
      break
    }
  }
  
  if (headerRowIdx >= 0) {
    console.log(`\n实际表头在第${headerRowIdx}行:`)
    const headers = json[headerRowIdx]
    console.log(`  列数: ${headers.length}`)
    console.log(`  前15个表头:`, headers.slice(0, 15))
    console.log(`  全部表头:`, headers.join(' | '))
    
    // 显示第一行数据
    if (headerRowIdx + 1 < json.length) {
      const dataRow = json[headerRowIdx + 1]
      console.log(`\n  第一行数据(行${headerRowIdx + 1}):`)
      headers.slice(0, 15).forEach((h, idx) => {
        console.log(`    "${h}" => ${JSON.stringify(dataRow[idx])} (${typeof dataRow[idx]})`)
      })
      
      // 查看"日期"列的值
      const dateIdx = headers.findIndex(h => String(h).includes('日期'))
      if (dateIdx >= 0) {
        console.log(`\n  "日期"列(idx=${dateIdx})的前5个值:`)
        for (let r = headerRowIdx + 1; r < Math.min(headerRowIdx + 6, json.length); r++) {
          const val = json[r][dateIdx]
          console.log(`    行${r}: ${JSON.stringify(val)} (类型: ${typeof val})`)
        }
      }
    }
  } else {
    console.log('\n未找到包含"日期"的表头行')
  }
})
