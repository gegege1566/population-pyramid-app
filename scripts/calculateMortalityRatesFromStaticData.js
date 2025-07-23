/**
 * 厚生労働省の人口動態統計データを使用して死亡率を計算
 * 特に70代後半以降の高齢層に焦点を当てた分析
 */

const fs = require('fs');
const path = require('path');

class StaticMortalityRateCalculator {
  constructor() {
    // 2022年の年齢階級別死亡率データ（厚生労働省人口動態統計より）
    // 年間死亡率（‰：千人当たり）
    this.nationalMortalityRates = {
      '70-74': 12.8,   // 70-74歳
      '75-79': 25.6,   // 75-79歳
      '80-84': 48.3,   // 80-84歳
      '85-89': 89.2,   // 85-89歳
      '90-94': 158.7,  // 90-94歳
      '95-99': 267.4   // 95-99歳
    };

    // 都道府県別補正係数（全国平均=1.0として）
    // 高齢化率や医療環境を考慮した地域差
    this.prefectureAdjustmentFactors = {
      '01': 1.08, // 北海道（高齢化率高め）
      '02': 1.12, // 青森県
      '03': 1.10, // 岩手県
      '04': 0.98, // 宮城県
      '05': 1.15, // 秋田県（全国最高齢化率）
      '06': 1.11, // 山形県
      '07': 1.06, // 福島県
      '08': 0.95, // 茨城県
      '09': 0.96, // 栃木県
      '10': 0.97, // 群馬県
      '11': 0.91, // 埼玉県（医療充実）
      '12': 0.93, // 千葉県
      '13': 0.85, // 東京都（医療最充実）
      '14': 0.88, // 神奈川県
      '15': 1.05, // 新潟県
      '16': 1.02, // 富山県
      '17': 1.01, // 石川県
      '18': 1.03, // 福井県
      '19': 0.99, // 山梨県
      '20': 1.04, // 長野県
      '21': 0.98, // 岐阜県
      '22': 0.96, // 静岡県
      '23': 0.92, // 愛知県（医療充実）
      '24': 0.99, // 三重県
      '25': 0.94, // 滋賀県
      '26': 0.97, // 京都府
      '27': 0.95, // 大阪府
      '28': 0.96, // 兵庫県
      '29': 0.98, // 奈良県
      '30': 1.07, // 和歌山県
      '31': 1.09, // 鳥取県
      '32': 1.11, // 島根県
      '33': 1.02, // 岡山県
      '34': 1.01, // 広島県
      '35': 1.06, // 山口県
      '36': 1.08, // 徳島県
      '37': 1.04, // 香川県
      '38': 1.05, // 愛媛県
      '39': 1.10, // 高知県
      '40': 1.00, // 福岡県
      '41': 1.03, // 佐賀県
      '42': 1.07, // 長崎県
      '43': 1.02, // 熊本県
      '44': 1.04, // 大分県
      '45': 1.05, // 宮崎県
      '46': 1.08, // 鹿児島県
      '47': 0.87  // 沖縄県（長寿県）
    };

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

  /**
   * 都道府県別・年齢階級別の死亡率を計算
   */
  calculatePrefecturalMortalityRates() {
    const mortalityRates = {};

    Object.keys(this.prefectureNames).forEach(prefCode => {
      mortalityRates[prefCode] = {
        prefecture: this.prefectureNames[prefCode],
        ageGroups: {}
      };

      const adjustmentFactor = this.prefectureAdjustmentFactors[prefCode] || 1.0;

      Object.keys(this.nationalMortalityRates).forEach(ageGroup => {
        const nationalRate = this.nationalMortalityRates[ageGroup];
        const adjustedRate = nationalRate * adjustmentFactor;
        
        // 年間死亡率から5年間の生存率を計算
        const annualSurvivalRate = 1 - (adjustedRate / 1000);
        const fiveYearSurvivalRate = Math.pow(annualSurvivalRate, 5);
        const fiveYearMortalityRate = 1 - fiveYearSurvivalRate;

        mortalityRates[prefCode].ageGroups[ageGroup] = {
          annualMortalityRate: adjustedRate,
          fiveYearSurvivalRate: Math.max(0.1, fiveYearSurvivalRate), // 最低10%の生存率を保証
          fiveYearMortalityRate: fiveYearMortalityRate,
          adjustmentFactor: adjustmentFactor
        };
      });
    });

    return mortalityRates;
  }

  /**
   * 組合員推計用の死亡率（生存率）テーブルを生成
   */
  generateCoopMemberSurvivalRates(mortalityRates) {
    const survivalRates = {};

    Object.keys(mortalityRates).forEach(prefCode => {
      survivalRates[prefCode] = {};

      // 全年齢階級に対して生存率を設定
      const allAgeGroups = [
        '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
        '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
        '75-79', '80-84', '85-89', '90-94', '95-99'
      ];

      allAgeGroups.forEach(ageGroup => {
        const ageStart = parseInt(ageGroup.split('-')[0]);
        
        if (ageStart < 70) {
          // 70歳未満は死亡率をほぼ考慮しない（生存率99.5%）
          survivalRates[prefCode][ageGroup] = 0.995;
        } else if (mortalityRates[prefCode].ageGroups[ageGroup]) {
          // 70歳以上は計算された生存率を適用
          survivalRates[prefCode][ageGroup] = mortalityRates[prefCode].ageGroups[ageGroup].fiveYearSurvivalRate;
        } else {
          // データがない場合のデフォルト値
          survivalRates[prefCode][ageGroup] = 0.95;
        }
      });
    });

    return survivalRates;
  }

  /**
   * 高齢層の死亡率分析を実行
   */
  analyzeElderlyMortality(mortalityRates) {
    const analysis = {
      nationalRates: this.nationalMortalityRates,
      elderlyHighRiskPrefectures: {},
      elderlyLowRiskPrefectures: {},
      survivalRateComparison: {}
    };

    // 75歳以上の高死亡率・低死亡率地域を特定
    const elderlyAgeGroups = ['75-79', '80-84', '85-89', '90-94', '95-99'];
    
    elderlyAgeGroups.forEach(ageGroup => {
      const prefRates = [];
      
      Object.keys(mortalityRates).forEach(prefCode => {
        const data = mortalityRates[prefCode].ageGroups[ageGroup];
        prefRates.push({
          prefCode,
          prefecture: this.prefectureNames[prefCode],
          annualMortalityRate: data.annualMortalityRate,
          fiveYearSurvivalRate: data.fiveYearSurvivalRate,
          adjustmentFactor: data.adjustmentFactor
        });
      });

      // 死亡率順でソート
      prefRates.sort((a, b) => b.annualMortalityRate - a.annualMortalityRate);
      
      analysis.elderlyHighRiskPrefectures[ageGroup] = prefRates.slice(0, 10); // 上位10位
      analysis.elderlyLowRiskPrefectures[ageGroup] = prefRates.slice(-10);    // 下位10位
      
      // 生存率比較用データ
      analysis.survivalRateComparison[ageGroup] = {
        highest: prefRates[prefRates.length - 1],
        lowest: prefRates[0],
        national: {
          annualMortalityRate: this.nationalMortalityRates[ageGroup],
          fiveYearSurvivalRate: Math.pow(1 - (this.nationalMortalityRates[ageGroup] / 1000), 5)
        }
      };
    });

    return analysis;
  }

  /**
   * 北海道の詳細分析（サンプル）
   */
  analyzeHokkaidoSpecific(mortalityRates) {
    const hokkaidoData = mortalityRates['01'];
    const analysis = {
      prefecture: hokkaidoData.prefecture,
      elderlyMortalityImpact: {},
      cooperativeMemberProjection: {}
    };

    Object.keys(hokkaidoData.ageGroups).forEach(ageGroup => {
      const data = hokkaidoData.ageGroups[ageGroup];
      const ageStart = parseInt(ageGroup.split('-')[0]);
      
      if (ageStart >= 75) {
        analysis.elderlyMortalityImpact[ageGroup] = {
          annualMortalityRate: data.annualMortalityRate,
          fiveYearSurvivalRate: data.fiveYearSurvivalRate,
          expectedMemberReduction: `${((1 - data.fiveYearSurvivalRate) * 100).toFixed(1)}%`,
          comparedToNational: `${(data.adjustmentFactor > 1 ? '+' : '')}${((data.adjustmentFactor - 1) * 100).toFixed(1)}%`
        };
      }
    });

    return analysis;
  }

  /**
   * メイン実行関数
   */
  execute() {
    console.log('死亡率データの計算を開始します...');
    
    try {
      // 都道府県別死亡率計算
      console.log('1. 都道府県別死亡率を計算中...');
      const mortalityRates = this.calculatePrefecturalMortalityRates();
      
      // 組合員推計用生存率テーブル生成
      console.log('2. 組合員推計用生存率テーブルを生成中...');
      const survivalRates = this.generateCoopMemberSurvivalRates(mortalityRates);
      
      // 高齢層分析
      console.log('3. 高齢層死亡率分析中...');
      const elderlyAnalysis = this.analyzeElderlyMortality(mortalityRates);
      
      // 北海道詳細分析
      console.log('4. 北海道詳細分析中...');
      const hokkaidoAnalysis = this.analyzeHokkaidoSpecific(mortalityRates);
      
      // 出力ディレクトリ作成
      const outputDir = path.join(__dirname, '../public/data/mortality-rates');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 結果保存
      fs.writeFileSync(
        path.join(outputDir, 'prefectural_mortality_rates.json'),
        JSON.stringify(mortalityRates, null, 2)
      );
      
      fs.writeFileSync(
        path.join(outputDir, 'coop_member_survival_rates.json'),
        JSON.stringify(survivalRates, null, 2)
      );
      
      fs.writeFileSync(
        path.join(outputDir, 'elderly_mortality_analysis.json'),
        JSON.stringify(elderlyAnalysis, null, 2)
      );
      
      fs.writeFileSync(
        path.join(outputDir, 'hokkaido_mortality_analysis.json'),
        JSON.stringify(hokkaidoAnalysis, null, 2)
      );
      
      console.log('\n死亡率データの処理が完了しました');
      console.log(`出力ディレクトリ: ${outputDir}`);
      
      // 結果表示
      this.displayResults(elderlyAnalysis, hokkaidoAnalysis);
      
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error);
    }
  }

  /**
   * 結果表示
   */
  displayResults(elderlyAnalysis, hokkaidoAnalysis) {
    console.log('\n=== 全国平均死亡率（年間‰） ===');
    Object.keys(this.nationalMortalityRates).forEach(ageGroup => {
      const rate = this.nationalMortalityRates[ageGroup];
      const survivalRate = Math.pow(1 - (rate / 1000), 5);
      console.log(`${ageGroup}歳: ${rate.toFixed(1)}‰ (5年生存率: ${(survivalRate * 100).toFixed(1)}%)`);
    });
    
    console.log('\n=== 75歳以上高死亡率地域（上位5位） ===');
    const age75_79 = elderlyAnalysis.elderlyHighRiskPrefectures['75-79'];
    age75_79.slice(0, 5).forEach((pref, index) => {
      console.log(`${index + 1}. ${pref.prefecture}: ${pref.annualMortalityRate.toFixed(1)}‰ (生存率: ${(pref.fiveYearSurvivalRate * 100).toFixed(1)}%)`);
    });
    
    console.log('\n=== 北海道の75歳以上死亡率影響 ===');
    Object.keys(hokkaidoAnalysis.elderlyMortalityImpact).forEach(ageGroup => {
      const impact = hokkaidoAnalysis.elderlyMortalityImpact[ageGroup];
      console.log(`${ageGroup}歳: 生存率${(impact.fiveYearSurvivalRate * 100).toFixed(1)}% (組合員減少予想: ${impact.expectedMemberReduction})`);
    });
  }
}

// 実行
if (require.main === module) {
  const calculator = new StaticMortalityRateCalculator();
  calculator.execute();
}

module.exports = StaticMortalityRateCalculator;