const fs = require('fs');
const path = require('path');

// 全都道府県の年齢階級別人口増減率計算スクリプト

class PopulationChangeRateCalculator {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.outputDir = path.join(this.dataDir, 'change-rates');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 年度リスト
    this.years = [2025, 2030, 2035, 2040, 2045, 2050];
    this.baseYear = 2025;

    // 都道府県コード（01-47）
    this.prefectureCodes = [];
    for (let i = 1; i <= 47; i++) {
      this.prefectureCodes.push(i.toString().padStart(2, '0'));
    }

    // 年齢階級リスト
    this.ageGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    // 都道府県名マップ
    this.prefectureNames = {
      '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
      '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
      '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
      '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
      '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
      '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
      '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
      '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
      '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
      '46': '鹿児島県', '47': '沖縄県'
    };
  }

  // 人口データを読み込み
  loadPopulationData(year) {
    const filePath = path.join(this.populationDir, `population_${year}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`人口データファイルが見つかりません: ${filePath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  }

  // 都道府県・年代別の人口を集計
  aggregateByPrefectureAndAge(populationData) {
    const result = {};
    
    Object.keys(populationData).forEach(prefCode => {
      if (!result[prefCode]) {
        result[prefCode] = {};
      }
      
      populationData[prefCode].forEach(item => {
        const ageGroup = item.ageGroup;
        if (!result[prefCode][ageGroup]) {
          result[prefCode][ageGroup] = {
            total: 0,
            male: 0,
            female: 0
          };
        }
        
        result[prefCode][ageGroup].total += item.population;
        if (item.gender === 'male') {
          result[prefCode][ageGroup].male += item.population;
        } else if (item.gender === 'female') {
          result[prefCode][ageGroup].female += item.population;
        }
      });
    });
    
    return result;
  }

  // 増減率を計算（前の5年を基準とする）
  calculateChangeRates() {
    console.log('🔄 全都道府県の人口増減率計算を開始...\n');
    console.log('※ 各年度は前の5年を基準とした増減率で計算します');

    const changeRates = {};

    // 各年度の増減率を計算
    for (let i = 1; i < this.years.length; i++) {
      const previousYear = this.years[i - 1];
      const currentYear = this.years[i];
      
      console.log(`\n${currentYear}年の増減率を計算中（基準：${previousYear}年）...`);
      
      // 前年度と現年度のデータを読み込み
      const previousData = this.loadPopulationData(previousYear);
      const currentData = this.loadPopulationData(currentYear);
      
      const previousAggregated = this.aggregateByPrefectureAndAge(previousData);
      const currentAggregated = this.aggregateByPrefectureAndAge(currentData);
      
      changeRates[currentYear] = {};
      
      let processedPrefectures = 0;
      
      // 都道府県ごとに計算
      this.prefectureCodes.forEach(prefCode => {
        if (!previousAggregated[prefCode] || !currentAggregated[prefCode]) {
          console.warn(`  ⚠ ${this.prefectureNames[prefCode] || prefCode}のデータが不完全です`);
          return;
        }
        
        changeRates[currentYear][prefCode] = {};
        
        // 年齢階級ごとに増減率を計算
        this.ageGroups.forEach(ageGroup => {
          const previousPopulation = previousAggregated[prefCode][ageGroup];
          const currentPopulation = currentAggregated[prefCode][ageGroup];
          
          if (!previousPopulation || !currentPopulation) {
            changeRates[currentYear][prefCode][ageGroup] = {
              total: 0,
              male: 0,
              female: 0,
              baseYear: previousYear
            };
            return;
          }
          
          // 増減率 = (現年人口 - 前年人口) / 前年人口
          changeRates[currentYear][prefCode][ageGroup] = {
            total: previousPopulation.total > 0 ? 
              ((currentPopulation.total - previousPopulation.total) / previousPopulation.total) : 0,
            male: previousPopulation.male > 0 ? 
              ((currentPopulation.male - previousPopulation.male) / previousPopulation.male) : 0,
            female: previousPopulation.female > 0 ? 
              ((currentPopulation.female - previousPopulation.female) / previousPopulation.female) : 0,
            baseYear: previousYear
          };
        });
        
        processedPrefectures++;
      });
      
      console.log(`  ✓ ${currentYear}年完了（${processedPrefectures}都道府県処理）`);
    }
    
    console.log('\n📊 5年間隔の増減率計算が完了しました！');
    return changeRates;
  }

  // データを保存
  saveChangeRates(changeRates) {
    console.log('\n💾 増減率データを保存中...');
    
    // 年度別に保存
    Object.keys(changeRates).forEach(year => {
      const filename = `population_change_rates_${year}.json`;
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(changeRates[year], null, 2));
      console.log(`  ✓ ${filename} を保存しました`);
    });
    
    // 全データを一つのファイルに保存
    const allDataFilename = 'population_change_rates_all.json';
    const allDataFilepath = path.join(this.outputDir, allDataFilename);
    
    const metadata = {
      calculationType: '5年間隔増減率',
      years: this.years,
      prefectures: this.prefectureNames,
      ageGroups: this.ageGroups,
      generatedAt: new Date().toISOString(),
      description: '前の5年を基準とした都道府県・年齢階級別人口増減率'
    };
    
    const fullData = {
      metadata,
      changeRates
    };
    
    fs.writeFileSync(allDataFilepath, JSON.stringify(fullData, null, 2));
    console.log(`  ✓ ${allDataFilename} を保存しました`);
  }

  // サンプル分析結果を表示
  displaySampleAnalysis(changeRates) {
    console.log('\n📈 サンプル分析結果:');
    
    // 各年度の基準年を表示
    console.log('\n📅 計算基準年:');
    Object.keys(changeRates).forEach(year => {
      const samplePrefCode = '01';
      const baseYear = changeRates[year][samplePrefCode]['20-24'].baseYear;
      console.log(`  ${year}年 → 基準: ${baseYear}年`);
    });
    
    // 北海道の2030年データを表示
    const samplePrefCode = '01';
    const sampleYear = '2030';
    const sampleData = changeRates[sampleYear][samplePrefCode];
    const baseYear = sampleData['20-24'].baseYear;
    
    console.log(`\n${this.prefectureNames[samplePrefCode]}の${sampleYear}年増減率（対${baseYear}年比）:`);
    this.ageGroups.forEach(ageGroup => {
      if (sampleData[ageGroup]) {
        const rate = sampleData[ageGroup].total;
        const percentage = (rate * 100).toFixed(1);
        if (Math.abs(rate) > 0.01) { // 1%以上の変化のみ表示
          console.log(`  ${ageGroup}: ${percentage > 0 ? '+' : ''}${percentage}%`);
        }
      }
    });
    
    // 5年間隔の増減率パターンを表示
    console.log(`\n📊 北海道の5年間隔増減率パターン（20-24歳）:`);
    Object.keys(changeRates).forEach(year => {
      const data = changeRates[year][samplePrefCode]['20-24'];
      const rate = (data.total * 100).toFixed(1);
      console.log(`  ${data.baseYear}→${year}: ${rate > 0 ? '+' : ''}${rate}%`);
    });
  }

  // メイン実行
  run() {
    try {
      const changeRates = this.calculateChangeRates();
      this.saveChangeRates(changeRates);
      this.displaySampleAnalysis(changeRates);
      
      console.log('\n🎉 全処理が完了しました！');
      console.log(`📁 出力先: ${this.outputDir}`);
      
    } catch (error) {
      console.error('\n❌ エラーが発生しました:', error.message);
      process.exit(1);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const calculator = new PopulationChangeRateCalculator();
  calculator.run();
}

module.exports = PopulationChangeRateCalculator;