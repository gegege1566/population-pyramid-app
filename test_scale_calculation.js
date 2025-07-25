// スケール計算のテストスクリプト
const fs = require('fs');
const path = require('path');

function testScaleCalculation() {
  console.log('🧮 スケール計算テスト開始\n');
  
  // 全国データ読み込み
  const nationalData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'public/data/population_api/population_national_2025.json'), 'utf8'
  ));
  
  console.log('📊 全国データ (2025年):');
  console.log(`総レコード数: ${nationalData.length}`);
  
  // 最大人口を計算
  let maxPopulation = 0;
  let maxRecord = null;
  
  nationalData.forEach(record => {
    if (record.population > maxPopulation) {
      maxPopulation = record.population;
      maxRecord = record;
    }
  });
  
  console.log(`最大人口: ${maxPopulation.toLocaleString()}千人`);
  console.log(`最大人口の年齢層: ${maxRecord.ageGroup}歳 ${maxRecord.gender}`);
  
  // スケール計算ロジック（localDataService.tsと同じ）
  let scale;
  
  if (maxPopulation <= 30) {
    // 小規模: 5千人単位、余裕15%
    scale = Math.ceil(maxPopulation * 1.15 / 5) * 5;
  } else if (maxPopulation <= 80) {
    // 中小規模: 10千人単位、余裕10%
    scale = Math.ceil(maxPopulation * 1.1 / 10) * 10;
  } else if (maxPopulation <= 200) {
    // 中規模: 20千人単位、余裕8%
    scale = Math.ceil(maxPopulation * 1.08 / 20) * 20;
  } else if (maxPopulation <= 300) {
    // 大規模: 30千人単位、余裕5%
    scale = Math.ceil(maxPopulation * 1.05 / 30) * 30;
  } else {
    // 特大規模: 50千人単位、余裕5%
    scale = Math.ceil(maxPopulation * 1.05 / 50) * 50;
  }
  
  scale = Math.max(scale, 15); // 最低15千人
  
  console.log(`\n📏 計算されたスケール: ${scale.toLocaleString()}千人`);
  console.log(`スケール範囲: 0 〜 ${scale.toLocaleString()}千人`);
  
  // 代表的な年齢層の確認
  console.log('\n📈 代表的な年齢層:');
  const sampleAges = ['0-4', '40-44', '50-54', '75-79'];
  
  sampleAges.forEach(ageGroup => {
    const ageData = nationalData.filter(d => d.ageGroup === ageGroup);
    const total = ageData.reduce((sum, d) => sum + d.population, 0);
    const percentage = ((total / scale) * 100).toFixed(1);
    
    console.log(`  ${ageGroup}歳: ${total.toLocaleString()}千人 (スケールの${percentage}%)`);
  });
  
  // 都道府県データとの比較
  console.log('\n🏔️ 北海道データとの比較:');
  const hokkaidoData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'public/data/population_api/population_2025.json'), 'utf8'
  ))['01'];
  
  const hokkaido40_44 = hokkaidoData.filter(d => d.ageGroup === '40-44');
  const hokkaidoTotal = hokkaido40_44.reduce((sum, d) => sum + d.population, 0);
  
  const national40_44 = nationalData.filter(d => d.ageGroup === '40-44');
  const nationalTotal = national40_44.reduce((sum, d) => sum + d.population, 0);
  
  console.log(`北海道40-44歳: ${hokkaidoTotal}千人`);
  console.log(`全国40-44歳: ${nationalTotal.toLocaleString()}千人`);
  console.log(`比率: ${((hokkaidoTotal / nationalTotal) * 100).toFixed(2)}%`);
  
  console.log('\n✅ スケール計算テスト完了');
  console.log('🎯 グラフは適切なスケールで表示されるはずです');
}

testScaleCalculation();