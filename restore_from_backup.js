#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public/data/population');

console.log('🔄 バックアップファイルから復元中...');

// 復元するファイルのリスト
const files = [
  'population_2025.json',
  'population_2030.json', 
  'population_2035.json',
  'population_2040.json',
  'population_2045.json',
  'population_2050.json',
  'population_national_2025.json',
  'population_national_2030.json',
  'population_national_2035.json',
  'population_national_2040.json',
  'population_national_2045.json',
  'population_national_2050.json'
];

files.forEach(filename => {
  const originalPath = path.join(dataDir, filename);
  const backupPath = path.join(dataDir, `${filename}.backup_original`);
  
  if (fs.existsSync(backupPath)) {
    console.log(`📋 復元中: ${filename}`);
    fs.copyFileSync(backupPath, originalPath);
    console.log(`✅ 復元完了: ${filename}`);
  } else {
    console.log(`⚠️ バックアップが見つからない: ${filename}.backup_original`);
  }
});

console.log('✅ バックアップからの復元が完了しました');