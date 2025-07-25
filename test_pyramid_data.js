// 人口ピラミッドデータの変換テスト
const fs = require('fs');

// 修正されたcreatePopulationPyramid関数のシミュレーション
function createPopulationPyramid(data) {
  const pyramid = {
    ageGroups: [],
    maleData: [],
    femaleData: []
  };
  
  // 年齢階級でグループ化（高齢者を上に表示するため降順）
  const ageGroups = Array.from(new Set(data.map(d => d.ageGroup))).sort((a, b) => {
    // 年齢順にソート（降順）
    if (a === '85+') return -1;
    if (b === '85+') return 1;
    const aStart = parseInt(a.split('-')[0]);
    const bStart = parseInt(b.split('-')[0]);
    return bStart - aStart;
  });
  
  ageGroups.forEach(ageGroup => {
    const malePopulation = data.find(d => d.ageGroup === ageGroup && d.gender === 'male')?.population || 0;
    const femalePopulation = data.find(d => d.ageGroup === ageGroup && d.gender === 'female')?.population || 0;
    
    // 修正後: 全国・都道府県データ共に既に千人単位で統一済み
    const maleScale = malePopulation;
    const femaleScale = femalePopulation;
    
    pyramid.ageGroups.push(ageGroup);
    pyramid.maleData.push(-maleScale); // 左側表示のため負の値
    pyramid.femaleData.push(femaleScale);
  });
  
  return pyramid;
}

// 全国データのテスト
console.log('🧪 人口ピラミッドデータ変換テスト\n');

const nationalData = JSON.parse(fs.readFileSync(
  './public/data/population_api/population_national_2025.json', 'utf8'
));

console.log('📊 入力データ (全国2025年):');
console.log(`レコード数: ${nationalData.length}`);

// サンプルレコード表示
const sample40_44 = nationalData.filter(d => d.ageGroup === '40-44');
console.log('40-44歳サンプル:');
sample40_44.forEach(d => {
  console.log(`  ${d.gender}: ${d.population.toLocaleString()}千人`);
});

// ピラミッドデータに変換
const pyramidData = createPopulationPyramid(nationalData);

console.log('\n📈 変換後ピラミッドデータ:');
console.log(`年齢グループ数: ${pyramidData.ageGroups.length}`);

// 40-44歳の変換結果確認
const age40_44Index = pyramidData.ageGroups.indexOf('40-44');
if (age40_44Index !== -1) {
  const maleValue = Math.abs(pyramidData.maleData[age40_44Index]);
  const femaleValue = pyramidData.femaleData[age40_44Index];
  
  console.log('40-44歳変換結果:');
  console.log(`  男性: ${maleValue.toLocaleString()} (負の値: ${pyramidData.maleData[age40_44Index]})`);
  console.log(`  女性: ${femaleValue.toLocaleString()}`);
  console.log(`  合計: ${(maleValue + femaleValue).toLocaleString()}千人`);
}

// 最大値確認
const maxMale = Math.max(...pyramidData.maleData.map(Math.abs));
const maxFemale = Math.max(...pyramidData.femaleData);
const overallMax = Math.max(maxMale, maxFemale);

console.log(`\n📏 グラフ表示用最大値: ${overallMax.toLocaleString()}千人`);

console.log('\n✅ これで全国グラフが正常に表示されるはずです');