#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// より精密な変換（小数点1桁まで保持）
const dataDir = path.join(__dirname, 'public/data/population');
const nationalFiles = [
  'population_national_2025.json',
  'population_national_2030.json', 
  'population_national_2035.json',
  'population_national_2040.json',
  'population_national_2045.json',
  'population_national_2050.json'
];

console.log('🔄 Restoring from backup and converting with higher precision...');

nationalFiles.forEach(filename => {
  const filePath = path.join(dataDir, filename);
  const backupPath = filePath + '.backup';
  
  if (fs.existsSync(backupPath)) {
    console.log(`📝 Processing ${filename}...`);
    
    // バックアップから元のデータを読み込み
    const originalData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log(`  - Restoring from backup (sample: ${originalData[0].population})`);
    
    // より精密な変換（小数点1桁まで保持）
    const convertedData = originalData.map(record => ({
      ...record,
      population: Math.round(record.population / 1000 * 10) / 10 // 小数点1桁まで保持
    }));
    
    // 変換後のデータを保存
    fs.writeFileSync(filePath, JSON.stringify(convertedData, null, 2));
    
    console.log(`  ✅ Converted with precision (sample: ${originalData[0].population} → ${convertedData[0].population})`);
  } else {
    console.log(`  ❌ Backup not found: ${filename}.backup`);
  }
});

console.log('✅ Precise conversion completed!');