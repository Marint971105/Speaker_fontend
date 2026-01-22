const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 读取 Excel 文件
const excelPath = path.join(__dirname, '..', 'zhuanyemulu.xlsx');
console.log('正在读取 Excel 文件:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error('Excel 文件不存在:', excelPath);
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 将工作表转换为 JSON（保留所有行）
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: false
});

console.log(`\n总行数: ${data.length}`);
console.log(`\n=== 前20行数据（用于分析结构）===\n`);

// 显示前20行数据，分析结构
for (let i = 0; i < Math.min(20, data.length); i++) {
  const row = data[i];
  console.log(`第 ${i + 1} 行:`, JSON.stringify(row, null, 2));
}

// 查找表头行
let headerRowIndex = -1;
let headerRow = null;
for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  if (row && row.length > 0) {
    const firstCell = String(row[0] || '').trim();
    // 检查是否是表头（可能包含"学科门类"、"一级学科"、"二级学科"等关键词）
    if (firstCell.includes('学科门类') || firstCell.includes('一级学科') || 
        firstCell.includes('二级学科') || firstCell.includes('专业代码') || 
        firstCell.includes('专业名称')) {
      headerRowIndex = i;
      headerRow = row;
      break;
    }
  }
}

if (headerRowIndex >= 0) {
  console.log(`\n=== 表头信息 ===`);
  console.log(`表头行索引: ${headerRowIndex}`);
  console.log(`表头内容:`, headerRow);
  
  // 分析表头各列的含义
  const columnMap = {};
  headerRow.forEach((header, index) => {
    if (header) {
      columnMap[header] = index;
    }
  });
  console.log(`\n列映射:`, columnMap);
}

// 分析数据行的结构
console.log(`\n=== 分析数据行结构 ===`);
let dataRowCount = 0;
for (let i = (headerRowIndex >= 0 ? headerRowIndex + 1 : 0); i < data.length && dataRowCount < 10; i++) {
  const row = data[i];
  if (row && row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
    console.log(`\n数据行示例 ${dataRowCount + 1} (第 ${i + 1} 行):`);
    console.log(`  完整行数据:`, row);
    if (headerRow) {
      console.log(`  对应字段:`);
      headerRow.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== null) {
          console.log(`    ${header}: ${row[index]}`);
        }
      });
    }
    dataRowCount++;
  }
}

console.log(`\n=== 分析完成 ===`);

