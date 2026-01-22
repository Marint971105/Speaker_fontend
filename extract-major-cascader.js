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

console.log(`总行数: ${data.length}`);

// 表头行索引（第1行，索引为0）
const HEADER_ROW_INDEX = 0;
const headerRow = data[HEADER_ROW_INDEX];

// 列索引映射
const COL_INDEX = {
  DISCIPLINE: 0,    // 学科门类
  FIRST_LEVEL: 1,   // 一级学科
  SECOND_LEVEL: 2   // 二级学科（专业）
};

// 构建三级级联数据结构
const structure = {};

// 从第2行开始处理数据（索引为1）
for (let i = HEADER_ROW_INDEX + 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  
  const discipline = String(row[COL_INDEX.DISCIPLINE] || '').trim();
  const firstLevel = String(row[COL_INDEX.FIRST_LEVEL] || '').trim();
  const secondLevel = String(row[COL_INDEX.SECOND_LEVEL] || '').trim();
  
  if (!discipline || !firstLevel || !secondLevel) continue;
  
  // 初始化学科门类
  if (!structure[discipline]) {
    structure[discipline] = {
      name: discipline,
      firstLevels: {}
    };
  }
  
  // 初始化一级学科
  if (!structure[discipline].firstLevels[firstLevel]) {
    structure[discipline].firstLevels[firstLevel] = {
      name: firstLevel,
      secondLevels: []
    };
  }
  
  // 添加二级学科（专业）
  structure[discipline].firstLevels[firstLevel].secondLevels.push({
    name: secondLevel
  });
}

// 生成级联选择器数据格式
const cascaderData = Object.keys(structure).map(disciplineName => {
  const discipline = structure[disciplineName];
  const firstLevels = Object.keys(discipline.firstLevels).map(firstLevelName => {
    const firstLevel = discipline.firstLevels[firstLevelName];
    return {
      value: firstLevelName,
      label: firstLevelName,
      children: firstLevel.secondLevels.map(secondLevel => ({
        value: secondLevel.name,
        label: secondLevel.name
      }))
    };
  });
  
  return {
    value: disciplineName,
    label: disciplineName,
    children: firstLevels
  };
});

// 统计信息
console.log('\n=== 专业目录结构统计 ===\n');

const disciplines = Object.keys(structure);
console.log(`学科门类总数: ${disciplines.length}\n`);

let totalFirstLevels = 0;
let totalSecondLevels = 0;

disciplines.forEach(disciplineName => {
  const discipline = structure[disciplineName];
  const firstLevels = Object.keys(discipline.firstLevels);
  let secondLevelCount = 0;
  
  firstLevels.forEach(firstLevelName => {
    secondLevelCount += discipline.firstLevels[firstLevelName].secondLevels.length;
  });
  
  totalFirstLevels += firstLevels.length;
  totalSecondLevels += secondLevelCount;
  
  console.log(`${disciplineName}`);
  console.log(`  一级学科数: ${firstLevels.length}`);
  console.log(`  专业总数: ${secondLevelCount}`);
});

console.log(`\n总计:`);
console.log(`  学科门类: ${disciplines.length}`);
console.log(`  一级学科: ${totalFirstLevels}`);
console.log(`  专业: ${totalSecondLevels}`);

// 保存为 JSON 文件
const outputPath = path.join(__dirname, 'src', 'utils', 'majorCascaderData.json');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(cascaderData, null, 2), 'utf8');
console.log(`\n级联选择器数据已保存到: ${outputPath}`);

// 保存完整结构数据（用于查找）
const structurePath = path.join(__dirname, 'src', 'utils', 'majorStructure.json');
fs.writeFileSync(structurePath, JSON.stringify(structure, null, 2), 'utf8');
console.log(`完整结构数据已保存到: ${structurePath}`);

console.log('\n=== 完成 ===');

