#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public/data/population');

console.log('🔍 バックアップファイルの品質分析...');

function analyzeDuplicates(data, fileName) {
  console.log(`\n📊 ${fileName} の分析:`);
  
  if (!Array.isArray(data)) {
    console.log('  📋 都道府県データ形式です');
    
    // 都道府県データの場合
    let totalDuplicateIssues = 0;
    const samplePrefectures = ['10', '11', '12']; // 群馬、埼玉、千葉
    
    samplePrefectures.forEach(prefCode => {
      if (!data[prefCode]) {
        console.log(`  ⚠️ ${prefCode} データなし`);
        return;
      }
      
      const prefData = data[prefCode];
      const prefName = prefData[0]?.prefecture || `都道府県${prefCode}`;
      
      ['male', 'female'].forEach(gender => {
        const genderData = prefData.filter(d => d.gender === gender);
        const populations = genderData.map(d => d.population);
        const valueMap = new Map();
        
        genderData.forEach(d => {
          if (!valueMap.has(d.population)) {
            valueMap.set(d.population, []);
          }
          valueMap.get(d.population).push(d.ageGroup);
        });
        
        const duplicates = Array.from(valueMap.entries()).filter(([value, ageGroups]) => ageGroups.length > 1);
        
        if (duplicates.length > 0) {
          console.log(`    ❌ ${prefName} ${gender === 'male' ? '男性' : '女性'}: ${duplicates.length}個の重複`);
          duplicates.forEach(([value, ageGroups]) => {
            if (ageGroups.length > 2) { // 3つ以上の重複は特に問題
              console.log(`      🔸 値 ${value}: ${ageGroups.join(', ')}`);
            }
          });
          totalDuplicateIssues += duplicates.length;
        }
      });
    });
    
    if (totalDuplicateIssues === 0) {
      console.log('  ✅ サンプル都道府県で重複問題は見つかりませんでした');
    } else {
      console.log(`  ❌ 合計 ${totalDuplicateIssues} 個の重複問題を発見`);
    }
    
  } else {
    console.log('  📋 全国データ形式です');
    
    // 全国データの場合
    ['male', 'female'].forEach(gender => {
      const genderData = data.filter(d => d.gender === gender);
      const populations = genderData.map(d => d.population);
      const valueMap = new Map();
      
      genderData.forEach(d => {
        if (!valueMap.has(d.population)) {
          valueMap.set(d.population, []);
        }
        valueMap.get(d.population).push(d.ageGroup);
      });
      
      const duplicates = Array.from(valueMap.entries()).filter(([value, ageGroups]) => ageGroups.length > 1);
      
      if (duplicates.length > 0) {
        console.log(`  ❌ 全国 ${gender === 'male' ? '男性' : '女性'}: ${duplicates.length}個の重複`);
        duplicates.forEach(([value, ageGroups]) => {
          console.log(`    🔸 値 ${value}: ${ageGroups.join(', ')}`);
        });
      } else {
        console.log(`  ✅ 全国 ${gender === 'male' ? '男性' : '女性'}: 重複問題なし`);
      }
    });
  }
}

// 分析するファイル
const filesToAnalyze = [
  'population_2025.json.backup_original',
  'population_national_2025.json.backup_original',
  'population_national_2025.json.backup'
];

filesToAnalyze.forEach(filename => {
  const filePath = path.join(dataDir, filename);
  
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      analyzeDuplicates(data, filename);
    } catch (error) {
      console.log(`❌ ${filename}: 読み込みエラー - ${error.message}`);
    }
  } else {
    console.log(`⚠️ ${filename}: ファイルが見つかりません`);
  }
});

console.log('\n✅ 分析完了');