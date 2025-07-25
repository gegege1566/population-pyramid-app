// APIデータの整合性テストスクリプト
const fs = require('fs');
const path = require('path');

function testApiData() {
  console.log('🧪 APIデータ整合性テスト開始\n');
  
  const apiDir = path.join(__dirname, 'public/data/population_api');
  const years = [2025, 2030, 2035, 2040];
  
  console.log('📂 利用可能なファイル:');
  const files = fs.readdirSync(apiDir);
  files.forEach(file => {
    const stats = fs.statSync(path.join(apiDir, file));
    console.log(`  ${file}: ${Math.round(stats.size / 1024)}KB`);
  });
  
  console.log('\n🔍 データ整合性確認:');
  
  years.forEach(year => {
    console.log(`\n--- ${year}年 ---`);
    
    // 都道府県データの確認
    const prefFile = path.join(apiDir, `population_${year}.json`);
    if (fs.existsSync(prefFile)) {
      try {
        const prefData = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
        const prefCodes = Object.keys(prefData);
        const totalRecords = Object.values(prefData).reduce((sum, data) => sum + data.length, 0);
        
        console.log(`✅ 都道府県データ: ${prefCodes.length}都道府県, ${totalRecords}レコード`);
        
        // 北海道40-44歳のサンプル確認
        if (prefData['01']) {
          const hokkaido40_44 = prefData['01'].filter(d => d.ageGroup === '40-44');
          if (hokkaido40_44.length > 0) {
            const total = hokkaido40_44.reduce((sum, d) => sum + d.population, 0);
            console.log(`  北海道40-44歳: ${total}千人 (${hokkaido40_44.map(d => `${d.gender}:${d.population}`).join(', ')})`);
          }
        }
        
      } catch (error) {
        console.log(`❌ 都道府県データエラー: ${error.message}`);
      }
    } else {
      console.log(`❌ 都道府県データファイルなし`);
    }
    
    // 全国データの確認
    const nationalFile = path.join(apiDir, `population_national_${year}.json`);
    if (fs.existsSync(nationalFile)) {
      try {
        const nationalData = JSON.parse(fs.readFileSync(nationalFile, 'utf8'));
        
        console.log(`✅ 全国データ: ${nationalData.length}レコード`);
        
        // 全国40-44歳のサンプル確認
        const national40_44 = nationalData.filter(d => d.ageGroup === '40-44');
        if (national40_44.length > 0) {
          const total = national40_44.reduce((sum, d) => sum + d.population, 0);
          console.log(`  全国40-44歳: ${total}千人 (${national40_44.map(d => `${d.gender}:${d.population}`).join(', ')})`);
        }
        
      } catch (error) {
        console.log(`❌ 全国データエラー: ${error.message}`);
      }
    } else {
      console.log(`❌ 全国データファイルなし`);
    }
  });
  
  console.log('\n🏔️ 北海道40-44歳の年次変化:');
  
  const hokkaidoChanges = [];
  years.forEach(year => {
    const prefFile = path.join(apiDir, `population_${year}.json`);
    if (fs.existsSync(prefFile)) {
      try {
        const prefData = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
        if (prefData['01']) {
          const hokkaido40_44 = prefData['01'].filter(d => d.ageGroup === '40-44');
          const total = hokkaido40_44.reduce((sum, d) => sum + d.population, 0);
          hokkaidoChanges.push({ year, total });
        }
      } catch (error) {
        console.log(`⚠ ${year}年データ読み込みエラー`);
      }
    }
  });
  
  hokkaidoChanges.forEach((data, index) => {
    if (index > 0) {
      const prev = hokkaidoChanges[index - 1];
      const change = data.total - prev.total;
      const changeRate = prev.total > 0 ? ((change / prev.total) * 100) : 0;
      console.log(`${data.year}年: ${data.total}千人 (前期比: ${change > 0 ? '+' : ''}${change}千人, ${changeRate > 0 ? '+' : ''}${changeRate.toFixed(1)}%)`);
    } else {
      console.log(`${data.year}年: ${data.total}千人 (基準年)`);
    }
  });
  
  // 組合員推計データとの比較
  console.log('\n👥 組合員推計データとの比較:');
  
  const coopDir = path.join(__dirname, 'public/data/coop-members');
  if (fs.existsSync(coopDir)) {
    [2025, 2030].forEach(year => {
      const coopFile = path.join(coopDir, `coop_members_01_${year}_corrected.json`);
      if (fs.existsSync(coopFile)) {
        try {
          const coopData = JSON.parse(fs.readFileSync(coopFile, 'utf8'));
          const coop40_44 = coopData.find(d => d.ageGroup === '40-44');
          
          // 人口データ取得
          const prefFile = path.join(apiDir, `population_${year}.json`);
          if (fs.existsSync(prefFile)) {
            const prefData = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
            const hokkaido40_44 = prefData['01'].filter(d => d.ageGroup === '40-44');
            const totalPop = hokkaido40_44.reduce((sum, d) => sum + d.population, 0);
            
            if (coop40_44 && totalPop > 0) {
              const shareRate = (coop40_44.memberCount / totalPop) * 100;
              console.log(`${year}年 北海道40-44歳: 人口${totalPop}千人, 組合員${coop40_44.memberCount}千人, シェア率${shareRate.toFixed(1)}%`);
            }
          }
          
        } catch (error) {
          console.log(`⚠ ${year}年組合員データ読み込みエラー`);
        }
      }
    });
  }
  
  console.log('\n✅ APIデータ整合性テスト完了');
}

testApiData();