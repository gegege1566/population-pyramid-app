#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 全国データファイルを千人単位に変換するスクリプト
const dataDir = path.join(__dirname, 'public/data/population');
const nationalFiles = [
  'population_national_2025.json',
  'population_national_2030.json',
  'population_national_2035.json',
  'population_national_2040.json',
  'population_national_2045.json',
  'population_national_2050.json'
];

console.log('🔄 Converting national population data from actual numbers to thousands...');

nationalFiles.forEach(filename => {
  const filePath = path.join(dataDir, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`📝 Processing ${filename}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 実人数かどうかチェック（10万人以上は実人数と判定）
    const sampleRecord = data[0];
    if (sampleRecord && sampleRecord.population > 100000) {
      console.log(`  - Converting from actual numbers (sample: ${sampleRecord.population}) to thousands`);
      
      // 全レコードを千人単位に変換
      const convertedData = data.map(record => ({
        ...record,
        population: Math.round(record.population / 1000)
      }));
      
      // バックアップを作成
      fs.writeFileSync(filePath + '.backup', JSON.stringify(data, null, 2));
      
      // 変換後のデータを保存
      fs.writeFileSync(filePath, JSON.stringify(convertedData, null, 2));
      
      console.log(`  ✅ Converted ${data.length} records (sample: ${sampleRecord.population} → ${Math.round(sampleRecord.population / 1000)})`);
    } else {
      console.log(`  ⏭️ Already in thousands format (sample: ${sampleRecord.population})`);
    }
  } else {
    console.log(`  ❌ File not found: ${filename}`);
  }
});

console.log('✅ National data conversion completed!');