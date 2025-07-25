// ローカルデータから北海道の40-44歳人口を確認するスクリプト
const fs = require('fs');
const path = require('path');

function checkHokkaidoPopulation() {
  console.log('🔍 北海道（01）の40-44歳人口データをローカルファイルから確認中...\n');
  
  try {
    // 2025年データの確認
    const data2025Path = path.join(__dirname, 'public/data/population/population_2025.json');
    const data2025 = JSON.parse(fs.readFileSync(data2025Path, 'utf8'));
    
    // 北海道の40-44歳データを抽出
    const hokkaido2025 = data2025['01'] ? data2025['01'].filter(d => 
      d.ageGroup === '40-44'
    ) : [];
    
    console.log('📅 2025年 北海道 40-44歳:');
    let male2025 = 0, female2025 = 0;
    hokkaido2025.forEach(d => {
      console.log(`  ${d.gender}: ${d.population.toLocaleString()}人`);
      if (d.gender === 'male') male2025 = d.population;
      if (d.gender === 'female') female2025 = d.population;
    });
    const total2025 = male2025 + female2025;
    console.log(`  合計: ${total2025.toLocaleString()}千人`);
    console.log(`  (実人数換算: 男性${(male2025*1000).toLocaleString()}人, 女性${(female2025*1000).toLocaleString()}人, 合計${(total2025*1000).toLocaleString()}人)`);
    
    // 2030年データの確認
    const data2030Path = path.join(__dirname, 'public/data/population/population_2030.json');
    const data2030 = JSON.parse(fs.readFileSync(data2030Path, 'utf8'));
    
    const hokkaido2030 = data2030['01'] ? data2030['01'].filter(d => 
      d.ageGroup === '40-44'
    ) : [];
    
    console.log('\n📅 2030年 北海道 40-44歳:');
    let male2030 = 0, female2030 = 0;
    hokkaido2030.forEach(d => {
      console.log(`  ${d.gender}: ${d.population.toLocaleString()}人`);
      if (d.gender === 'male') male2030 = d.population;
      if (d.gender === 'female') female2030 = d.population;
    });
    const total2030 = male2030 + female2030;
    console.log(`  合計: ${total2030.toLocaleString()}千人`);
    console.log(`  (実人数換算: 男性${(male2030*1000).toLocaleString()}人, 女性${(female2030*1000).toLocaleString()}人, 合計${(total2030*1000).toLocaleString()}人)`);
    
    // 変化の計算
    const totalChange = total2030 - total2025;
    const changeRate = (totalChange / total2025) * 100;
    
    console.log('\n📊 人口変化:');
    console.log(`  絶対数変化: ${totalChange.toLocaleString()}千人`);
    console.log(`  変化率: ${changeRate.toFixed(2)}%`);
    
    // 組合員シェア率の計算
    const coopMembers2025 = 146.2; // 千人
    const totalPop2025Thousand = total2025; // 既に千人単位
    const shareRate = (coopMembers2025 / totalPop2025Thousand) * 100;
    
    console.log('\n🔢 組合員シェア率計算:');
    console.log(`  2025年組合員数: ${coopMembers2025}千人`);  
    console.log(`  2025年人口: ${totalPop2025Thousand}千人`);
    console.log(`  シェア率: ${shareRate.toFixed(2)}%`);
    
    // 2030年の推計組合員数
    const totalPop2030Thousand = total2030; // 既に千人単位
    const projected2030 = totalPop2030Thousand * (shareRate / 100);
    console.log(`\n📈 2030年推計:`);
    console.log(`  2030年人口: ${totalPop2030Thousand}千人`);
    console.log(`  推計組合員数: ${projected2030.toFixed(1)}千人 (シェア率${shareRate.toFixed(2)}%維持)`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkHokkaidoPopulation();