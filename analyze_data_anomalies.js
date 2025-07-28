#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public/data/population');
const years = ['2025', '2030', '2035', '2040', '2045', '2050'];

console.log('🔍 都道府県データの異常値分析を開始...');

years.forEach(year => {
  const filePath = path.join(dataDir, `population_${year}.json`);
  
  if (fs.existsSync(filePath)) {
    console.log(`\n📊 ${year}年データ分析:`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 各都道府県の重複値をチェック
    Object.keys(data).forEach(prefCode => {
      const prefData = data[prefCode];
      const prefecture = prefData[0]?.prefecture || `都道府県コード${prefCode}`;
      
      // 男性データの重複チェック
      const maleData = prefData.filter(d => d.gender === 'male');
      const malePopulations = maleData.map(d => d.population);
      const maleDuplicates = findDuplicates(malePopulations, maleData);
      
      // 女性データの重複チェック
      const femaleData = prefData.filter(d => d.gender === 'female');
      const femalePopulations = femaleData.map(d => d.population);
      const femaleDuplicates = findDuplicates(femalePopulations, femaleData);
      
      if (maleDuplicates.length > 0 || femaleDuplicates.length > 0) {
        console.log(`  ❌ ${prefecture} (${prefCode}):`);
        
        if (maleDuplicates.length > 0) {
          maleDuplicates.forEach(dup => {
            console.log(`    男性 ${dup.value}: ${dup.ageGroups.join(', ')}`);
          });
        }
        
        if (femaleDuplicates.length > 0) {
          femaleDuplicates.forEach(dup => {
            console.log(`    女性 ${dup.value}: ${dup.ageGroups.join(', ')}`);
          });
        }
      }
    });
  }
});

function findDuplicates(populations, data) {
  const valueMap = new Map();
  
  // 値と対応する年齢階級をマッピング
  data.forEach(d => {
    const value = d.population;
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value).push(d.ageGroup);
  });
  
  // 重複している値（2つ以上の年齢階級で同じ値）を抽出
  const duplicates = [];
  valueMap.forEach((ageGroups, value) => {
    if (ageGroups.length > 1) {
      duplicates.push({ value, ageGroups });
    }
  });
  
  return duplicates;
}

console.log('\n✅ 分析完了');