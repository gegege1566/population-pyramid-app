const fs = require('fs').promises;
const path = require('path');

// 2020年データを読み込んで2025-2050年のデータを生成
async function generateFutureData() {
  try {
    const dataDir = path.join(__dirname, '..', 'public', 'data', 'population');
    
    // 2020年データを読み込む
    const data2020 = JSON.parse(
      await fs.readFile(path.join(dataDir, 'population_2020.json'), 'utf8')
    );
    
    const futureYears = [2025, 2030, 2035, 2040, 2045, 2050];
    
    for (const year of futureYears) {
      console.log(`Generating data for ${year}...`);
      
      const futureData = {};
      
      // 各都道府県のデータを生成
      for (const [prefCode, prefData] of Object.entries(data2020)) {
        futureData[prefCode] = generateFuturePrefectureData(prefData, 2020, year);
      }
      
      // ファイルに保存
      const filePath = path.join(dataDir, `population_${year}.json`);
      await fs.writeFile(filePath, JSON.stringify(futureData, null, 2));
      console.log(`✓ Generated data for ${year}`);
    }
    
    console.log('\n✅ All future data generated successfully!');
    
  } catch (error) {
    console.error('Error generating future data:', error);
  }
}

// 将来の人口データを生成（簡易的な推計）
function generateFuturePrefectureData(baseData, baseYear, targetYear) {
  const yearDiff = targetYear - baseYear;
  const futureData = [];
  
  // 年齢階級の順序
  const ageGroups = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', 
                     '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', 
                     '60-64', '65-69', '70-74', '75-79', '80-84', '85+'];
  
  // 各年齢階級・性別のデータを生成
  for (const gender of ['male', 'female']) {
    for (const ageGroup of ageGroups) {
      const baseItem = baseData.find(d => d.gender === gender && d.ageGroup === ageGroup);
      
      if (baseItem) {
        // 簡易的な人口変化率（年齢によって異なる）
        let changeRate = 1.0;
        
        // 若年層は減少傾向
        if (ageGroup.match(/^(0-4|5-9|10-14|15-19|20-24|25-29|30-34)$/)) {
          changeRate = 1 - (yearDiff * 0.015); // 5年で7.5%減少
        }
        // 中年層は微減
        else if (ageGroup.match(/^(35-39|40-44|45-49|50-54|55-59)$/)) {
          changeRate = 1 - (yearDiff * 0.005); // 5年で2.5%減少
        }
        // 高齢層は増加
        else {
          changeRate = 1 + (yearDiff * 0.01); // 5年で5%増加
        }
        
        futureData.push({
          year: targetYear,
          prefecture: baseItem.prefecture,
          prefectureCode: baseItem.prefectureCode,
          ageGroup: ageGroup,
          gender: gender,
          population: Math.max(1, Math.round(baseItem.population * changeRate))
        });
      }
    }
  }
  
  return futureData;
}

generateFutureData();