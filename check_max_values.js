// 全国データの最大値確認
const data = require('./public/data/population_api/population_national_2025.json');

console.log('📊 全国データの年齢別合計 (2025年):');

// 年齢別にグループ化して合計
const ageGroups = {};
data.forEach(record => {
  if (!ageGroups[record.ageGroup]) {
    ageGroups[record.ageGroup] = 0;
  }
  ageGroups[record.ageGroup] += record.population;
});

// 上位10位を表示
const sorted = Object.entries(ageGroups)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sorted.forEach(([age, total], index) => {
  console.log(`${index + 1}. ${age}歳: ${total.toLocaleString()}千人`);
});

const maxValue = Math.max(...Object.values(ageGroups));
console.log(`\n📏 真の最大値: ${maxValue.toLocaleString()}千人`);

// 修正されたスケール計算
let scale;
if (maxValue <= 50) {
  scale = Math.ceil(maxValue * 1.2 / 10) * 10;
} else if (maxValue <= 200) {
  scale = Math.ceil(maxValue * 1.15 / 20) * 20;
} else if (maxValue <= 500) {
  scale = Math.ceil(maxValue * 1.1 / 50) * 50;
} else if (maxValue <= 2000) {
  scale = Math.ceil(maxValue * 1.1 / 200) * 200;
} else if (maxValue <= 5000) {
  scale = Math.ceil(maxValue * 1.1 / 500) * 500;
} else {
  scale = Math.ceil(maxValue * 1.1 / 1000) * 1000;
}

scale = Math.max(scale, 15);

console.log(`\n🎯 適切なスケール: ${scale.toLocaleString()}千人`);
console.log(`余裕率: ${((scale / maxValue - 1) * 100).toFixed(1)}%`);

// 全データの最大個別値も確認
const maxIndividual = Math.max(...data.map(d => d.population));
console.log(`\n📋 個別レコード最大値: ${maxIndividual.toLocaleString()}千人`);