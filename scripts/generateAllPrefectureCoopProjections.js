const fs = require('fs');
const path = require('path');

// 全都道府県組合員数将来推計データ生成スクリプト（完全版）

class AllPrefectureCoopProjectionGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.changeRatesDir = path.join(this.dataDir, 'change-rates');
    this.coopMemberDir = path.join(this.dataDir, 'coop-members');
    this.mortalityDir = path.join(this.dataDir, 'mortality-rates');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.coopMemberDir)) {
      fs.mkdirSync(this.coopMemberDir, { recursive: true });
    }

    // 年度リスト
    this.years = [2025, 2030, 2035, 2040, 2045, 2050];
    this.baseYear = 2025;

    // 生存率データを読み込み
    this.loadSurvivalRates();

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

    // 全国の年齢構成比（生協データ総覧より）
    this.nationalAgeDistribution = {
      '20-24': 0.0066,
      '25-29': 0.0074,
      '30-34': 0.0395,
      '35-39': 0.0445,
      '40-44': 0.0731,
      '45-49': 0.0789,
      '50-54': 0.1086,
      '55-59': 0.1104,
      '60-64': 0.1237,
      '65-69': 0.1143,
      '70-74': 0.1140,
      '75-79': 0.0990,
      '80-84': 0.0385,
      '85-89': 0.0247,
      '90-94': 0.0120,
      '95-99': 0.0038
    };

    // 都道府県別組合員数（千人単位）
    this.prefectureTotalMembers = {
      '01': 2000, // 北海道
      '02': 161.337,  // 青森県
      '03': 292.156,  // 岩手県
      '04': 982.602,  // 宮城県
      '05': 170,  // 秋田県
      '06': 162.062,  // 山形県
      '07': 346,  // 福島県
      '08': 410,  // 茨城県
      '09': 284,  // 栃木県
      '10': 357,  // 群馬県
      '11': 720,  // 埼玉県
      '12': 610,  // 千葉県
      '13': 2579.432, // 東京都
      '14': 1380, // 神奈川県
      '15': 243,  // 新潟県
      '16': 85,   // 富山県
      '17': 135,  // 石川県
      '18': 360,  // 福井県
      '19': 80,   // 山梨県
      '20': 342,  // 長野県
      '21': 290,  // 岐阜県
      '22': 290,  // 静岡県
      '23': 750,  // 愛知県
      '24': 210,  // 三重県
      '25': 140,  // 滋賀県
      '26': 440,  // 京都府
      '27': 900,  // 大阪府
      '28': 1712.578, // 兵庫県
      '29': 265,  // 奈良県
      '30': 140,  // 和歌山県
      '31': 45,   // 鳥取県
      '32': 65,   // 島根県
      '33': 343.070,  // 岡山県
      '34': 340,  // 広島県
      '35': 200,  // 山口県
      '36': 60,   // 徳島県
      '37': 240,  // 香川県
      '38': 240,  // 愛媛県
      '39': 70,   // 高知県
      '40': 566,  // 福岡県
      '41': 70,   // 佐賀県
      '42': 225,  // 長崎県
      '43': 149,  // 熊本県
      '44': 186,  // 大分県
      '45': 271.806,  // 宮崎県
      '46': 343,  // 鹿児島県
      '47': 240   // 沖縄県
    };

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

  // 人口増減率データを読み込み
  loadChangeRatesData() {
    const filePath = path.join(this.changeRatesDir, 'population_change_rates_all.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`人口増減率データファイルが見つかりません: ${filePath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.changeRates;
  }

  // 都道府県・年代別の人口を集計
  aggregatePopulationByAge(populationData, prefCode) {
    const result = {};
    
    if (!populationData[prefCode]) {
      return result;
    }
    
    populationData[prefCode].forEach(item => {
      const ageGroup = item.ageGroup;
      if (!result[ageGroup]) {
        result[ageGroup] = 0;
      }
      result[ageGroup] += item.population; // 千人単位
    });
    
    return result;
  }

  // 2025年の都道府県別年齢別組合員数を計算
  calculate2025MembersByAge(prefCode) {
    const totalMembers = this.prefectureTotalMembers[prefCode] || 0;
    if (totalMembers === 0) return {};

    const members = {};
    
    this.ageGroups.forEach(ageGroup => {
      if (this.nationalAgeDistribution[ageGroup]) {
        // 全国の構成比を使用して都道府県の組合員数を推定（千人単位）
        members[ageGroup] = totalMembers * this.nationalAgeDistribution[ageGroup];
      } else {
        members[ageGroup] = 0; // 20歳未満は0
      }
    });

    return members;
  }

  // 2025年の年齢別組合員シェア率を計算
  calculate2025ShareRates(prefCode) {
    const pop2025 = this.loadPopulationData(2025);
    const ageGroupPop = this.aggregatePopulationByAge(pop2025, prefCode);
    const members2025 = this.calculate2025MembersByAge(prefCode);
    const shareRates = {};

    this.ageGroups.forEach(ageGroup => {
      if (members2025[ageGroup] && ageGroupPop[ageGroup] > 0) {
        // 組合員数（千人単位） ÷ 人口（千人単位）
        shareRates[ageGroup] = members2025[ageGroup] / ageGroupPop[ageGroup];
      } else {
        shareRates[ageGroup] = 0;
      }
    });

    return { shareRates, members2025 };
  }

  // 生存率データを読み込む関数
  loadSurvivalRates() {
    try {
      const survivalRatesPath = path.join(this.mortalityDir, 'coop_member_survival_rates.json');
      if (fs.existsSync(survivalRatesPath)) {
        const data = fs.readFileSync(survivalRatesPath, 'utf8');
        this.survivalRates = JSON.parse(data);
        console.log('生存率データを読み込みました');
      } else {
        console.warn('生存率データが見つかりません。デフォルト値を使用します。');
        this.survivalRates = this.getDefaultSurvivalRates();
      }
    } catch (error) {
      console.error('生存率データの読み込みに失敗しました:', error);
      this.survivalRates = this.getDefaultSurvivalRates();
    }
  }

  // デフォルト生存率（生存率データがない場合）
  getDefaultSurvivalRates() {
    const defaultRates = {};
    this.prefectureCodes.forEach(prefCode => {
      defaultRates[prefCode] = {};
      this.ageGroups.forEach(ageGroup => {
        const ageStart = parseInt(ageGroup.split('-')[0]);
        if (ageStart < 70) {
          defaultRates[prefCode][ageGroup] = 0.995; // 70歳未満は99.5%
        } else if (ageStart < 75) {
          defaultRates[prefCode][ageGroup] = 0.94;  // 70-74歳は94%
        } else if (ageStart < 80) {
          defaultRates[prefCode][ageGroup] = 0.88;  // 75-79歳は88%
        } else if (ageStart < 85) {
          defaultRates[prefCode][ageGroup] = 0.78;  // 80-84歳は78%
        } else if (ageStart < 90) {
          defaultRates[prefCode][ageGroup] = 0.63;  // 85-89歳は63%
        } else if (ageStart < 95) {
          defaultRates[prefCode][ageGroup] = 0.42;  // 90-94歳は42%
        } else {
          defaultRates[prefCode][ageGroup] = 0.21;  // 95-99歳は21%
        }
      });
    });
    return defaultRates;
  }

  // 生存率を取得する関数
  getSurvivalRate(prefCode, ageGroup) {
    if (this.survivalRates && this.survivalRates[prefCode] && this.survivalRates[prefCode][ageGroup]) {
      return this.survivalRates[prefCode][ageGroup];
    }
    // デフォルト値
    const ageStart = parseInt(ageGroup.split('-')[0]);
    return ageStart < 70 ? 0.995 : 0.90;
  }

  // コーホート繰り上がりによる推計（改良版）
  projectWithCohort(prefCode, targetYear, changeRates) {
    const { shareRates: shareRates2025, members2025 } = this.calculate2025ShareRates(prefCode);
    
    
    let currentMembers = { ...members2025 };
    let currentYear = this.baseYear;

    // 5年ずつ段階的に推計
    while (currentYear < targetYear) {
      const nextYear = currentYear + 5;
      if (nextYear > targetYear) break;

      const newMembers = {};
      
      this.ageGroups.forEach((ageGroup, index) => {
        let memberCount = 0;

        if (ageGroup === '0-4' || ageGroup === '5-9' || ageGroup === '10-14' || ageGroup === '15-19') {
          // 20歳未満は常に0
          memberCount = 0;
        } else if (ageGroup === '20-24' || ageGroup === '25-29' || ageGroup === '30-34') {
          // 若年層：シェア率維持（新規加入）
          // その年の実際の人口データを使用してシェア率を維持
          const nextYearPop = this.aggregatePopulationByAge(this.loadPopulationData(nextYear), prefCode)[ageGroup] || 0;
          
          const shareRate = shareRates2025[ageGroup] || 0;
          memberCount = nextYearPop * shareRate; // 千人単位 × シェア率
        } else {
          // 35歳以上：コーホート繰り上がり
          const sourceIndex = index - 1; // 1つ下の年齢層から繰り上がり
          
          if (sourceIndex >= 0 && this.ageGroups[sourceIndex]) {
            const sourceAgeGroup = this.ageGroups[sourceIndex];
            const sourceMembers = currentMembers[sourceAgeGroup] || 0;
            
            if (sourceMembers > 0) {
              // 人口変化による増減率を計算
              const changeRate = changeRates[nextYear] && changeRates[nextYear][prefCode] && changeRates[nextYear][prefCode][ageGroup] ?
                changeRates[nextYear][prefCode][ageGroup].total : 0;
              
              // 人口増減率を適用
              const populationAdjustment = 1 + changeRate;
              
              // 70歳以上の場合は死亡率（生存率）も考慮
              const ageStart = parseInt(ageGroup.split('-')[0]);
              let survivalFactor = 1.0;
              if (ageStart >= 70) {
                survivalFactor = this.getSurvivalRate(prefCode, ageGroup);
              }
              
              memberCount = sourceMembers * Math.max(0, populationAdjustment) * survivalFactor;
            }
          }
        }

        newMembers[ageGroup] = Math.round(memberCount);
      });

      currentMembers = newMembers;
      currentYear = nextYear;
    }

    return currentMembers;
  }

  // 追加の減衰率は使用しない（人口増減率のみを適用）
  // getAdditionalDecayRate() メソッドは削除

  // JSON形式に変換
  formatToJson(prefCode, year, membersByAge) {
    const result = [];
    const prefName = this.prefectureNames[prefCode];
    
    this.ageGroups.forEach(ageGroup => {
      result.push({
        year: year,
        prefecture: prefName,
        prefectureCode: prefCode,
        ageGroup: ageGroup,
        memberCount: Math.round(membersByAge[ageGroup] / 1000 * 100) / 100 // 千人単位、小数点2桁
      });
    });
    
    return result;
  }

  // データを保存
  saveData(prefCode, year, data) {
    const filename = `coop_members_${prefCode}_${year}.json`;
    const filepath = path.join(this.coopMemberDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`  ✓ ${filename} を保存しました`);
  }

  // 単一都道府県の全年度推計を実行
  generatePrefectureProjections(prefCode) {
    const prefName = this.prefectureNames[prefCode];
    console.log(`\n🏛️ ${prefName}の組合員数推計を開始...`);

    try {
      const changeRates = this.loadChangeRatesData();
      
      this.years.forEach(year => {
        if (year === this.baseYear) {
          // 2025年は基準データ
          const { members2025 } = this.calculate2025ShareRates(prefCode);
          const data = this.formatToJson(prefCode, year, members2025);
          this.saveData(prefCode, year, data);
          
          const total = Object.values(members2025).reduce((sum, val) => sum + val, 0);
          console.log(`  ${year}年（基準）: ${total.toLocaleString()}人`);
        } else {
          // 2030年以降はコーホート推計
          const projectedMembers = this.projectWithCohort(prefCode, year, changeRates);
          const data = this.formatToJson(prefCode, year, projectedMembers);
          this.saveData(prefCode, year, data);
          
          const total = Object.values(projectedMembers).reduce((sum, val) => sum + val, 0);
          console.log(`  ${year}年: ${total.toLocaleString()}人`);
        }
      });

      console.log(`✅ ${prefName}完了`);
      return true;
    } catch (error) {
      console.error(`❌ ${prefName}の処理に失敗:`, error.message);
      return false;
    }
  }

  // 全都道府県の推計を実行
  generateAllProjections() {
    console.log('🚀 全都道府県の組合員数将来推計を開始...\n');
    
    let successCount = 0;
    let failCount = 0;

    this.prefectureCodes.forEach(prefCode => {
      if (this.generatePrefectureProjections(prefCode)) {
        successCount++;
      } else {
        failCount++;
      }
    });

    console.log(`\n📊 処理結果:`);
    console.log(`  ✅ 成功: ${successCount}都道府県`);
    console.log(`  ❌ 失敗: ${failCount}都道府県`);
    console.log(`\n🎉 全都道府県の組合員数推計が完了しました！`);
    console.log(`📁 出力先: ${this.coopMemberDir}`);
  }

  // メイン実行
  run() {
    try {
      this.generateAllProjections();
    } catch (error) {
      console.error('\n❌ 全体的なエラーが発生しました:', error.message);
      process.exit(1);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const generator = new AllPrefectureCoopProjectionGenerator();
  generator.run();
}

module.exports = AllPrefectureCoopProjectionGenerator;