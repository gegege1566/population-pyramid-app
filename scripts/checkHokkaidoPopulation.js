const fs = require('fs');
const path = require('path');

// 北海道の人口データを確認
const years = [2025, 2030, 2035, 2040, 2045, 2050];

console.log('=== 北海道の人口データ確認 ===\n');

years.forEach(year => {
  const filePath = path.join(__dirname, `../public/data/population/population_${year}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const hokkaidoData = data['01'] || [];
    
    const ageGroups = {};
    hokkaidoData.forEach(d => {
      if (!ageGroups[d.ageGroup]) ageGroups[d.ageGroup] = 0;
      ageGroups[d.ageGroup] += d.population;
    });
    
    console.log(`${year}年の北海道人口（千人）:`);
    const sortedAges = Object.keys(ageGroups).sort((a, b) => {
      const aStart = parseInt(a.split('-')[0]);
      const bStart = parseInt(b.split('-')[0]);
      return aStart - bStart;
    });
    
    sortedAges.forEach(age => {
      console.log(`  ${age}: ${ageGroups[age].toFixed(0)}千人`);
    });
    
    const total = Object.values(ageGroups).reduce((sum, val) => sum + val, 0);
    console.log(`  合計: ${total.toFixed(0)}千人\n`);
  } else {
    console.log(`${year}年のデータファイルが見つかりません\n`);
  }
});