// 欠損データと組合員シェア率の確認
const fs = require('fs');

console.log('🔍 データ欠損と組合員シェア率の確認\n');

// 1. 95-99歳データの確認
console.log('=== 95-99歳データの確認 ===');
const nationalData = JSON.parse(fs.readFileSync('./public/data/population_api/population_national_2025.json', 'utf8'));

const ageGroups = [...new Set(nationalData.map(d => d.ageGroup))].sort((a, b) => {
  const aStart = parseInt(a.split('-')[0]);
  const bStart = parseInt(b.split('-')[0]);
  return aStart - bStart;
});

console.log('利用可能な年齢階級:');
ageGroups.forEach(age => console.log(`  ${age}歳`));

const has95_99 = ageGroups.includes('95-99');
console.log(`\n95-99歳データ存在: ${has95_99 ? 'あり' : 'なし'}`);

if (!has95_99) {
  console.log('❌ 95-99歳データが欠損しています');
  
  // API取得スクリプトで95-99歳の系列IDが含まれているか確認
  console.log('\n📋 APIスクリプトの系列ID確認が必要:');
  console.log('  男性95-99歳: "0201130120000010210"');
  console.log('  女性95-99歳: "0201130220000010210"');
}

// 2. 組合員シェア率の確認
console.log('\n=== 組合員シェア率の確認 ===');

try {
  const popData = JSON.parse(fs.readFileSync('./public/data/population_api/population_2025.json', 'utf8'));
  const coopData = JSON.parse(fs.readFileSync('./public/data/coop-members/coop_members_01_2025_corrected.json', 'utf8'));
  
  // 北海道の人口データ
  const hokkaidoPop = popData['01'];
  console.log(`北海道人口データ: ${hokkaidoPop.length}レコード`);
  
  // 年齢別人口合計
  const populationByAge = {};
  hokkaidoPop.forEach(d => {
    if (!populationByAge[d.ageGroup]) {
      populationByAge[d.ageGroup] = 0;
    }
    populationByAge[d.ageGroup] += d.population;
  });
  
  console.log('\n📊 北海道の年齢別シェア率:');
  coopData.forEach(coop => {
    const population = populationByAge[coop.ageGroup] || 0;
    const shareRate = population > 0 ? (coop.memberCount / population * 100) : 0;
    
    const status = shareRate > 30 ? '❌異常' : shareRate > 20 ? '⚠️高い' : shareRate > 15 ? '📈多い' : '✅正常';
    console.log(`  ${coop.ageGroup}歳: ${shareRate.toFixed(1)}% (組合員${coop.memberCount}千人 ÷ 人口${population}千人) ${status}`);
  });
  
  // 異常値の特定
  const abnormalRates = coopData.filter(coop => {
    const population = populationByAge[coop.ageGroup] || 0;
    const shareRate = population > 0 ? (coop.memberCount / population * 100) : 0;
    return shareRate > 20; // 20%超は異常
  });
  
  if (abnormalRates.length > 0) {
    console.log('\n❌ 異常なシェア率が検出されました:');
    abnormalRates.forEach(coop => {
      const population = populationByAge[coop.ageGroup] || 0;
      const shareRate = population > 0 ? (coop.memberCount / population * 100) : 0;
      console.log(`  ${coop.ageGroup}歳: ${shareRate.toFixed(1)}% (要修正)`);
    });
  }
  
} catch (error) {
  console.error('組合員データ確認エラー:', error.message);
}

console.log('\n=== 修正が必要な項目 ===');
console.log('1. 95-99歳データをAPIから再取得');
console.log('2. 異常な組合員シェア率の修正');
console.log('3. データの整合性確認');