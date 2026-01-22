const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 读取 Excel 文件
const excelPath = path.join(__dirname, '..', 'gaoxiaomingdan1.xlsx');
console.log('正在读取 Excel 文件:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error('Excel 文件不存在:', excelPath);
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 将工作表转换为 JSON（保留所有行，包括空行）
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null, // 空单元格返回 null
  raw: false // 不保留原始值
});

console.log(`\n=== Excel 文件基本信息 ===`);
console.log(`工作表名称: ${sheetName}`);
console.log(`总行数: ${data.length}`);
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
    if (firstCell === '序号' || firstCell.includes('序号')) {
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

// 分析省份标题行的模式
console.log(`\n=== 分析省份标题行模式 ===`);
let provincePatterns = [];
for (let i = 0; i < Math.min(100, data.length); i++) {
  const row = data[i];
  if (row && row.length > 0) {
    const firstCell = String(row[0] || '').trim();
    // 检查是否是省份标题行（包含"省"、"市"、"自治区"，且可能包含"（XX所）"）
    if (firstCell && (
      (firstCell.includes('省') && firstCell.includes('（')) ||
      (firstCell.includes('市') && firstCell.includes('（')) ||
      (firstCell.includes('自治区') && firstCell.includes('（')) ||
      (firstCell.includes('（') && firstCell.includes('所）'))
    )) {
      provincePatterns.push({
        rowIndex: i + 1,
        content: firstCell,
        fullRow: row
      });
    }
  }
}

console.log(`\n找到 ${provincePatterns.length} 个省份标题行（前10个）:`);
provincePatterns.slice(0, 10).forEach(pattern => {
  console.log(`  第 ${pattern.rowIndex} 行: ${pattern.content}`);
});

// 分析省份标题行之后的数据行模式
if (provincePatterns.length > 0) {
  console.log(`\n=== 分析省份标题行后的数据行 ===`);
  const firstProvince = provincePatterns[0];
  const startRow = firstProvince.rowIndex; // 转换为0-based索引
  const endRow = Math.min(startRow + 10, data.length);
  
  console.log(`\n省份 "${firstProvince.content}" 之后的数据行（前10行）:`);
  for (let i = startRow; i < endRow; i++) {
    const row = data[i];
    if (row && row.length > 0) {
      console.log(`  第 ${i + 1} 行:`, row);
    }
  }
}

// 统计每个省份的学校数量
console.log(`\n=== 统计每个省份的学校数量 ===`);
const provinceStats = [];
let currentProvince = null;
let schoolCount = 0;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  
  const firstCell = String(row[0] || '').trim();
  
  // 检查是否是省份标题行
  if (firstCell && (
    (firstCell.includes('省') && firstCell.includes('（')) ||
    (firstCell.includes('市') && firstCell.includes('（')) ||
    (firstCell.includes('自治区') && firstCell.includes('（')) ||
    (firstCell.includes('（') && firstCell.includes('所）'))
  )) {
    // 保存上一个省份的统计
    if (currentProvince) {
      provinceStats.push({
        province: currentProvince,
        schoolCount: schoolCount
      });
    }
    
    // 开始新的省份
    currentProvince = firstCell;
    schoolCount = 0;
  } else if (currentProvince) {
    // 检查是否是数据行（第一列是数字序号）
    const firstCellValue = row[0];
    if (typeof firstCellValue === 'number' || (typeof firstCellValue === 'string' && /^\d+$/.test(firstCellValue))) {
      schoolCount++;
    }
  }
}

// 保存最后一个省份
if (currentProvince) {
  provinceStats.push({
    province: currentProvince,
    schoolCount: schoolCount
  });
}

console.log(`\n省份统计（共 ${provinceStats.length} 个省份）:`);
provinceStats.forEach((stat, index) => {
  console.log(`  ${index + 1}. ${stat.province}: ${stat.schoolCount} 所学校`);
});

// 分析数据行的结构
console.log(`\n=== 分析数据行结构 ===`);
let dataRowCount = 0;
for (let i = 0; i < data.length && dataRowCount < 5; i++) {
  const row = data[i];
  if (row && row.length > 0) {
    const firstCell = row[0];
    // 检查是否是数据行（第一列是数字序号）
    if (typeof firstCell === 'number' || (typeof firstCell === 'string' && /^\d+$/.test(String(firstCell)))) {
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
}

console.log(`\n=== 分析完成 ===`);

