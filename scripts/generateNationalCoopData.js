const fs = require('fs').promises;
const path = require('path');

// 全国の組合員数を全都道府県から集計
async function generateNationalCoopData() {
  console.log('🏛️ 全国組合員データの生成を開始...\n');

  try {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    const coopDir = path.join(__dirname, '../public/data/coop-members');

    for (const year of years) {
      console.log(`📅 ${year}年の全国データを集計中...`);
      
      // 年齢階級別の合計を保持
      const nationalTotals = {};
      
      // 全都道府県のデータを読み込んで集計
      for (let prefCode = 1; prefCode <= 47; prefCode++) {
        const prefCodeStr = String(prefCode).padStart(2, '0');
        const filePath = path.join(coopDir, `coop_members_${prefCodeStr}_${year}.json`);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const prefData = JSON.parse(content);
          
          // 各年齢階級の数値を加算
          prefData.forEach(item => {
            if (!nationalTotals[item.ageGroup]) {
              nationalTotals[item.ageGroup] = 0;
            }
            nationalTotals[item.ageGroup] += item.memberCount;
          });
        } catch (error) {
          console.error(`  ⚠️ ${prefCodeStr}のデータ読み込みエラー:`, error.message);
        }
      }
      
      // 全国データとして整形
      const nationalData = Object.keys(nationalTotals)
        .sort((a, b) => {
          // 年齢階級をソート
          const ageOrder = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
                           '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
                           '75-79', '80-84', '85-89', '90-94', '95-99'];
          return ageOrder.indexOf(a) - ageOrder.indexOf(b);
        })
        .map(ageGroup => ({
          year: year,
          prefecture: '全国',
          prefectureCode: '00000',
          ageGroup: ageGroup,
          memberCount: Math.round(nationalTotals[ageGroup] * 10) / 10
        }));
      
      // ファイルに保存
      const outputPath = path.join(coopDir, `coop_members_national_${year}.json`);
      await fs.writeFile(outputPath, JSON.stringify(nationalData, null, 2));
      
      // 合計を表示
      const total = Object.values(nationalTotals).reduce((sum, val) => sum + val, 0);
      console.log(`  ✓ ${year}年: 全国合計 ${Math.round(total).toLocaleString()}千人`);
      console.log(`  💾 ${path.basename(outputPath)} を保存しました\n`);
    }
    
    console.log('✅ 全国組合員データの生成が完了しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
generateNationalCoopData();