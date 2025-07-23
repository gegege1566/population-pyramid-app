/**
 * e-Stat APIから死亡率データを取得し、年齢階級別・都道府県別の死亡率を計算
 * 特に70代後半以降の高齢層に焦点を当てた分析
 */

const fs = require('fs');
const path = require('path');

class MortalityRateCalculator {
  constructor() {
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.appId = 'YOUR_APP_ID'; // e-StatのアプリケーションID
    
    // 人口動態統計の統計表ID（死亡数）
    this.mortalityStatsId = '0000450011'; // 人口動態統計 死亡数
    this.populationStatsId = '0000200523'; // 国勢調査 人口
    
    // 都道府県コードマッピング
    this.prefectureCodes = this.getPrefectureCodes();
    
    // 年齢階級マッピング
    this.ageGroups = {
      '70-74': '17',
      '75-79': '18', 
      '80-84': '19',
      '85-89': '20',
      '90-94': '21',
      '95-99': '22'
    };
  }

  getPrefectureCodes() {
    return {
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

  /**
   * e-Stat APIから死亡数データを取得
   */
  async fetchMortalityData(year = 2022) {
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: this.mortalityStatsId,
      cdCat01: 'A2124', // 死亡数
      cdCat02: 'A0203', // 年齢階級別
      cdCat03: 'A0301', // 都道府県別
      cdTime: year.toString()
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.DATA) {
        return data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.DATA;
      }
      
      throw new Error('死亡数データの取得に失敗しました');
    } catch (error) {
      console.error('死亡数データ取得エラー:', error);
      return null;
    }
  }

  /**
   * e-Stat APIから人口データを取得
   */
  async fetchPopulationData(year = 2020) {
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: this.populationStatsId,
      cdCat01: 'A0002', // 総人口
      cdCat02: 'A0203', // 年齢階級別
      cdCat03: 'A0301', // 都道府県別
      cdTime: year.toString()
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.DATA) {
        return data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.DATA;
      }
      
      throw new Error('人口データの取得に失敗しました');
    } catch (error) {
      console.error('人口データ取得エラー:', error);
      return null;
    }
  }

  /**
   * 年齢階級別・都道府県別の死亡率を計算
   */
  calculateMortalityRates(mortalityData, populationData) {
    const mortalityRates = {};
    
    // 死亡数データを整理
    const mortalityByPrefAge = {};
    mortalityData.forEach(record => {
      const prefCode = this.extractPrefectureCode(record);
      const ageGroup = this.extractAgeGroup(record);
      const deaths = parseInt(record.VALUE) || 0;
      
      if (prefCode && ageGroup) {
        if (!mortalityByPrefAge[prefCode]) {
          mortalityByPrefAge[prefCode] = {};
        }
        mortalityByPrefAge[prefCode][ageGroup] = deaths;
      }
    });

    // 人口データを整理
    const populationByPrefAge = {};
    populationData.forEach(record => {
      const prefCode = this.extractPrefectureCode(record);
      const ageGroup = this.extractAgeGroup(record);
      const population = parseInt(record.VALUE) || 0;
      
      if (prefCode && ageGroup) {
        if (!populationByPrefAge[prefCode]) {
          populationByPrefAge[prefCode] = {};
        }
        populationByPrefAge[prefCode][ageGroup] = population;
      }
    });

    // 死亡率を計算
    Object.keys(this.prefectureCodes).forEach(prefCode => {
      mortalityRates[prefCode] = {};
      
      Object.keys(this.ageGroups).forEach(ageGroup => {
        const deaths = mortalityByPrefAge[prefCode]?.[ageGroup] || 0;
        const population = populationByPrefAge[prefCode]?.[ageGroup] || 0;
        
        if (population > 0) {
          // 年間死亡率（‰）
          const annualRate = (deaths / population) * 1000;
          // 5年間の生存率（死亡率から計算）
          const survivalRate = Math.pow(1 - (annualRate / 1000), 5);
          
          mortalityRates[prefCode][ageGroup] = {
            deaths,
            population,
            annualMortalityRate: annualRate,
            fiveYearSurvivalRate: survivalRate,
            fiveYearMortalityRate: 1 - survivalRate
          };
        } else {
          mortalityRates[prefCode][ageGroup] = {
            deaths: 0,
            population: 0,
            annualMortalityRate: 0,
            fiveYearSurvivalRate: 1,
            fiveYearMortalityRate: 0
          };
        }
      });
    });

    return mortalityRates;
  }

  /**
   * レコードから都道府県コードを抽出
   */
  extractPrefectureCode(record) {
    // API仕様に応じて実装
    // 例: record.AREA_CODE や record['@cat03'] など
    return null; // 実際のAPI仕様に合わせて修正が必要
  }

  /**
   * レコードから年齢階級を抽出
   */
  extractAgeGroup(record) {
    // API仕様に応じて実装
    // 例: record.AGE_CODE や record['@cat02'] など
    return null; // 実際のAPI仕様に合わせて修正が必要
  }

  /**
   * 70代後半以降の死亡率分析
   */
  analyzeElderlyMortality(mortalityRates) {
    const analysis = {
      nationalAverage: {},
      prefectureRanking: {},
      elderlyFocusedRates: {}
    };

    // 全国平均の計算
    Object.keys(this.ageGroups).forEach(ageGroup => {
      let totalDeaths = 0;
      let totalPopulation = 0;
      
      Object.keys(mortalityRates).forEach(prefCode => {
        const data = mortalityRates[prefCode][ageGroup];
        totalDeaths += data.deaths;
        totalPopulation += data.population;
      });
      
      if (totalPopulation > 0) {
        const nationalRate = (totalDeaths / totalPopulation) * 1000;
        const nationalSurvival = Math.pow(1 - (nationalRate / 1000), 5);
        
        analysis.nationalAverage[ageGroup] = {
          annualMortalityRate: nationalRate,
          fiveYearSurvivalRate: nationalSurvival,
          fiveYearMortalityRate: 1 - nationalSurvival
        };
      }
    });

    // 75歳以上の高死亡率地域分析
    const elderlyAgeGroups = ['75-79', '80-84', '85-89', '90-94', '95-99'];
    elderlyAgeGroups.forEach(ageGroup => {
      const prefRates = [];
      
      Object.keys(mortalityRates).forEach(prefCode => {
        const data = mortalityRates[prefCode][ageGroup];
        prefRates.push({
          prefCode,
          prefecture: this.prefectureCodes[prefCode],
          ...data
        });
      });
      
      // 死亡率順でソート
      prefRates.sort((a, b) => b.annualMortalityRate - a.annualMortalityRate);
      analysis.prefectureRanking[ageGroup] = prefRates;
    });

    return analysis;
  }

  /**
   * 組合員推計用の死亡率テーブルを生成
   */
  generateCoopMemberMortalityTable(mortalityRates) {
    const mortalityTable = {};
    
    Object.keys(this.prefectureCodes).forEach(prefCode => {
      mortalityTable[prefCode] = {};
      
      Object.keys(this.ageGroups).forEach(ageGroup => {
        const data = mortalityRates[prefCode][ageGroup];
        
        // 70歳未満は死亡率を考慮しない（0とする）
        const ageStart = parseInt(ageGroup.split('-')[0]);
        if (ageStart < 70) {
          mortalityTable[prefCode][ageGroup] = 1.0; // 生存率100%
        } else {
          // 70歳以上は実際の生存率を適用
          mortalityTable[prefCode][ageGroup] = Math.max(0.1, data.fiveYearSurvivalRate);
        }
      });
    });
    
    return mortalityTable;
  }

  /**
   * メイン実行関数
   */
  async execute() {
    console.log('死亡率データの取得を開始します...');
    
    try {
      // データ取得
      console.log('1. 死亡数データを取得中...');
      const mortalityData = await this.fetchMortalityData(2022);
      
      console.log('2. 人口データを取得中...');
      const populationData = await this.fetchPopulationData(2020);
      
      if (!mortalityData || !populationData) {
        throw new Error('必要なデータの取得に失敗しました');
      }
      
      // 死亡率計算
      console.log('3. 死亡率を計算中...');
      const mortalityRates = this.calculateMortalityRates(mortalityData, populationData);
      
      // 高齢層分析
      console.log('4. 高齢層の死亡率分析中...');
      const elderlyAnalysis = this.analyzeElderlyMortality(mortalityRates);
      
      // 組合員推計用テーブル生成
      console.log('5. 組合員推計用死亡率テーブルを生成中...');
      const coopMortalityTable = this.generateCoopMemberMortalityTable(mortalityRates);
      
      // 結果保存
      const outputDir = path.join(__dirname, '../public/data/mortality-rates');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 詳細データ保存
      fs.writeFileSync(
        path.join(outputDir, 'detailed_mortality_rates.json'),
        JSON.stringify(mortalityRates, null, 2)
      );
      
      // 高齢層分析結果保存
      fs.writeFileSync(
        path.join(outputDir, 'elderly_mortality_analysis.json'),
        JSON.stringify(elderlyAnalysis, null, 2)
      );
      
      // 組合員推計用テーブル保存
      fs.writeFileSync(
        path.join(outputDir, 'coop_member_mortality_table.json'),
        JSON.stringify(coopMortalityTable, null, 2)
      );
      
      console.log('死亡率データの処理が完了しました');
      console.log(`詳細データ: ${outputDir}/detailed_mortality_rates.json`);
      console.log(`高齢層分析: ${outputDir}/elderly_mortality_analysis.json`);
      console.log(`推計用テーブル: ${outputDir}/coop_member_mortality_table.json`);
      
      // 70代後半以降の全国平均を表示
      console.log('\n=== 70代後半以降の全国平均死亡率（年間‰） ===');
      ['75-79', '80-84', '85-89', '90-94', '95-99'].forEach(ageGroup => {
        const rate = elderlyAnalysis.nationalAverage[ageGroup];
        if (rate) {
          console.log(`${ageGroup}歳: ${rate.annualMortalityRate.toFixed(1)}‰ (5年生存率: ${(rate.fiveYearSurvivalRate * 100).toFixed(1)}%)`);
        }
      });
      
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error);
    }
  }
}

// 実行
if (require.main === module) {
  const calculator = new MortalityRateCalculator();
  calculator.execute();
}

module.exports = MortalityRateCalculator;