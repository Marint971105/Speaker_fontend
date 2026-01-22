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

// 将工作表转换为 JSON（保留所有行）
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: false
});

console.log(`\n总行数: ${data.length}`);

// 表头行索引（第3行，索引为2）
const HEADER_ROW_INDEX = 2;
const headerRow = data[HEADER_ROW_INDEX];

// 列索引映射
const COL_INDEX = {
  SEQUENCE: 0,      // 序号
  SCHOOL_NAME: 1,  // 学校名称
  SCHOOL_CODE: 2,  // 学校标识码
  DEPARTMENT: 3,   // 主管部门
  LOCATION: 4,     // 所在地
  LEVEL: 5,        // 办学层次
  REMARK: 6        // 备注
};

// 提取省份和学校数据
const provincesData = [];
let currentProvince = null;
let currentProvinceName = null;
let schoolIndex = 0;

for (let i = HEADER_ROW_INDEX + 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  
  const firstCell = String(row[0] || '').trim();
  
  // 检查是否是省份标题行
  // 格式：省份名称（XX所），例如：北京市（92所）、内蒙古自治区（54所）
  if (firstCell && (
    (firstCell.includes('省') && firstCell.includes('（')) ||
    (firstCell.includes('市') && firstCell.includes('（')) ||
    (firstCell.includes('自治区') && firstCell.includes('（')) ||
    (firstCell.includes('（') && firstCell.includes('所）'))
  )) {
    // 保存上一个省份的数据
    if (currentProvince) {
      provincesData.push(currentProvince);
      console.log(`✓ ${currentProvinceName}: ${currentProvince.schools.length} 所学校`);
    }
    
    // 提取省份名称（去掉"（XX所）"部分）
    const provinceNameMatch = firstCell.match(/^(.+?)（\d+所）$/);
    if (provinceNameMatch) {
      currentProvinceName = provinceNameMatch[1];
    } else {
      // 如果没有匹配到标准格式，尝试其他方式
      currentProvinceName = firstCell.replace(/（\d+所）$/, '').trim();
    }
    
    // 开始新的省份
    currentProvince = {
      province: currentProvinceName,
      provinceFullName: firstCell, // 保留完整格式，如"北京市（92所）"
      schools: []
    };
    schoolIndex = 0;
  } else if (currentProvince) {
    // 检查是否是数据行（第一列是数字序号）
    const firstCellValue = row[COL_INDEX.SEQUENCE];
    const schoolName = row[COL_INDEX.SCHOOL_NAME];
    
    if (firstCellValue && schoolName) {
      // 检查序号是否是数字（可能是字符串形式的数字）
      const sequenceStr = String(firstCellValue).trim();
      if (/^\d+$/.test(sequenceStr)) {
        schoolIndex++;
        currentProvince.schools.push({
          sequence: parseInt(sequenceStr),
          name: String(schoolName).trim(),
          code: row[COL_INDEX.SCHOOL_CODE] ? String(row[COL_INDEX.SCHOOL_CODE]).trim() : '',
          department: row[COL_INDEX.DEPARTMENT] ? String(row[COL_INDEX.DEPARTMENT]).trim() : '',
          location: row[COL_INDEX.LOCATION] ? String(row[COL_INDEX.LOCATION]).trim() : '',
          level: row[COL_INDEX.LEVEL] ? String(row[COL_INDEX.LEVEL]).trim() : '',
          remark: row[COL_INDEX.REMARK] ? String(row[COL_INDEX.REMARK]).trim() : ''
        });
      }
    }
  }
}

// 保存最后一个省份
if (currentProvince) {
  provincesData.push(currentProvince);
  console.log(`✓ ${currentProvinceName}: ${currentProvince.schools.length} 所学校`);
}

console.log(`\n=== 提取完成 ===`);
console.log(`共提取 ${provincesData.length} 个省份`);
console.log(`共提取 ${provincesData.reduce((sum, p) => sum + p.schools.length, 0)} 所学校`);

// 保存为 JSON 文件
const outputPath = path.join(__dirname, 'src', 'utils', 'schoolsByProvince.json');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(provincesData, null, 2), 'utf8');
console.log(`\n数据已保存到: ${outputPath}`);

// 生成级联选择器所需的数据格式
const cascaderData = provincesData.map(province => ({
  value: province.province,
  label: province.province,
  children: province.schools.map(school => ({
    value: school.name,
    label: school.name
  }))
}));

const cascaderOutputPath = path.join(__dirname, 'src', 'utils', 'schoolCascaderData.json');
fs.writeFileSync(cascaderOutputPath, JSON.stringify(cascaderData, null, 2), 'utf8');
console.log(`级联选择器数据已保存到: ${cascaderOutputPath}`);

// 验证数据
console.log(`\n=== 数据验证 ===`);
provincesData.forEach((province, index) => {
  const expectedCount = province.provinceFullName.match(/（(\d+)所）/);
  const actualCount = province.schools.length;
  if (expectedCount) {
    const expected = parseInt(expectedCount[1]);
    if (expected !== actualCount) {
      console.log(`⚠ 警告: ${province.province} 期望 ${expected} 所，实际 ${actualCount} 所`);
    }
  }
});

console.log(`\n=== 完成 ===`);

