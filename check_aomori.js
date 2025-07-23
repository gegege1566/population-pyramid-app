const fs = require('fs');

// 青森県の2025年人口データを確認
const pop2025 = JSON.parse(fs.readFileSync('public/data/population/population_2025.json'));
const aomori2025 = pop2025['02'];

if (!aomori2025) {
  console.log('青森県データが見つかりません。利用可能な都道府県コード:');
  console.log(Object.keys(pop2025));
} else {
  console.log('青森県の2025年人口データ（再取得後）:');
  console.log('30-34歳データ:');
  const age30_34 = aomori2025.filter(d => d.ageGroup === '30-34');
  age30_34.forEach(d => {
    console.log('  ' + d.gender + ': ' + d.population + ' 千人');
  });

  const total30_34 = age30_34.reduce((sum, d) => sum + d.population, 0);
  console.log('  合計: ' + total30_34 + ' 千人');

  // 組合員サービスでの青森県設定値
  const aomoriTotalMembers = 161337; // 人
  const composition30_34 = 3.95; // %

  // 30-34歳組合員数計算
  const members30_34 = (aomoriTotalMembers * composition30_34 / 100) / 1000; // 千人単位
  const shareRate = (members30_34 / total30_34) * 100;

  console.log('\n組合員計算:');
  console.log('青森県総組合員数:', aomoriTotalMembers.toLocaleString(), '人');
  console.log('30-34歳構成比:', composition30_34 + '%');
  console.log('30-34歳組合員数:', members30_34.toFixed(1), '千人');
  console.log('30-34歳シェア率:', shareRate.toFixed(1) + '%');
}