const fs = require('fs');
const path = require('path');

// 北海道専用組合員数将来推計データ生成スクリプト（コーホート方式）

class HokkaidoCoopProjectionCohortGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.coopMemberDir = path.join(this.dataDir, 'coop-members');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.coopMemberDir)) {
      fs.mkdirSync(this.coopMemberDir, { recursive: true });
    }

    // 北海道の基準組合員数（2025年）
    this.hokkaido2025TotalMembers = 2000000; // 2,000,000人

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
  }

  // 人口データ読み込み
  loadPopulationData(year) {
    const filePath = path.join(this.populationDir, `population_${year}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`人口データファイルが見つかりません: ${filePath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data['01'] || []; // 北海道のデータのみ
  }

  // 年齢階級別の人口を集計
  aggregatePopulation(populationData) {
    const ageGroupPop = {};
    populationData.forEach(item => {
      const ageGroup = item.ageGroup;
      if (!ageGroupPop[ageGroup]) {
        ageGroupPop[ageGroup] = 0;
      }
      ageGroupPop[ageGroup] += item.population; // 千人単位
    });
    return ageGroupPop;
  }

  // 2025年の北海道の年齢別組合員数を計算
  calculate2025MembersByAge() {
    const members = {};
    const allAgeGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    allAgeGroups.forEach(ageGroup => {
      if (this.nationalAgeDistribution[ageGroup]) {
        // 全国の構成比を使用して北海道の組合員数を推定
        members[ageGroup] = Math.round(this.hokkaido2025TotalMembers * this.nationalAgeDistribution[ageGroup]);
      } else {
        members[ageGroup] = 0; // 20歳未満は0
      }
    });

    return members;
  }

  // 2025年の年齢別組合員シェア率を計算
  calculate2025ShareRates() {
    const pop2025 = this.loadPopulationData(2025);
    const ageGroupPop = this.aggregatePopulation(pop2025);
    const members2025 = this.calculate2025MembersByAge();
    const shareRates = {};

    Object.keys(ageGroupPop).forEach(ageGroup => {
      if (members2025[ageGroup] && ageGroupPop[ageGroup] > 0) {
        // 組合員数（人） ÷ 人口（千人×1000）
        shareRates[ageGroup] = members2025[ageGroup] / (ageGroupPop[ageGroup] * 1000);
      } else {
        shareRates[ageGroup] = 0;
      }
    });

    console.log('\n2025年の北海道年齢別組合員シェア率:');
    Object.keys(shareRates).forEach(ageGroup => {
      if (shareRates[ageGroup] > 0) {
        console.log(`  ${ageGroup}: ${(shareRates[ageGroup] * 100).toFixed(2)}%`);
      }
    });

    return { shareRates, members2025 };
  }

  // コーホート繰り上がりによる推計
  projectWithCohort(targetYear) {
    console.log(`\n${targetYear}年の推計を開始...`);
    
    const { shareRates: shareRates2025, members2025 } = this.calculate2025ShareRates();
    const popTarget = this.aggregatePopulation(this.loadPopulationData(targetYear));
    
    const yearDiff = targetYear - 2025;
    const cohortShift = Math.floor(yearDiff / 5); // 5年ごとの繰り上がり数
    
    const projectedMembers = {};
    let totalProjected = 0;

    const ageGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    ageGroups.forEach((ageGroup, index) => {
      let memberCount = 0;

      if (ageGroup === '0-4' || ageGroup === '5-9' || ageGroup === '10-14' || ageGroup === '15-19') {
        // 20歳未満は常に0
        memberCount = 0;
      } else if (ageGroup === '20-24' || ageGroup === '25-29' || ageGroup === '30-34') {
        // 若年層：シェア率維持（新規加入）
        const population = popTarget[ageGroup] || 0;
        const shareRate = shareRates2025[ageGroup] || 0;
        memberCount = population * 1000 * shareRate; // 千人→人に変換
      } else {
        // 35歳以上：コーホート繰り上がり
        // cohortShift分だけ若い年齢層から繰り上がってくる
        const sourceIndex = index - cohortShift;
        
        if (sourceIndex >= 0 && ageGroups[sourceIndex]) {
          const sourceAgeGroup = ageGroups[sourceIndex];
          const sourceMembers = members2025[sourceAgeGroup] || 0;
          
          if (sourceMembers > 0) {
            // 人口変化による生存率を計算
            const sourcePop2025 = this.aggregatePopulation(this.loadPopulationData(2025))[sourceAgeGroup] || 1;
            const targetPop = popTarget[ageGroup] || 0;
            
            // 生存率 = 現在の該当年齢人口 / 過去の元年齢人口
            const survivalRate = Math.min(1, targetPop / sourcePop2025);
            
            // 追加の減衰率（高齢になるほど脱退率が上がる）
            const additionalDecay = this.getAdditionalDecayRate(ageGroup, yearDiff);
            
            memberCount = sourceMembers * survivalRate * additionalDecay;
          }
        }
      }

      projectedMembers[ageGroup] = Math.round(memberCount);
      totalProjected += projectedMembers[ageGroup];
    });

    console.log(`合計組合員数: ${totalProjected.toLocaleString()}人`);
    
    // 年齢分布を確認
    console.log('\n年齢別組合員数:');
    Object.keys(projectedMembers).forEach(ageGroup => {
      if (projectedMembers[ageGroup] > 0) {
        const percentage = (projectedMembers[ageGroup] / totalProjected * 100).toFixed(2);
        console.log(`  ${ageGroup}: ${projectedMembers[ageGroup].toLocaleString()}人 (${percentage}%)`);
      }
    });

    return projectedMembers;
  }

  // 高齢層の追加減衰率
  getAdditionalDecayRate(ageGroup, yearDiff) {
    const decayRates = {
      '35-39': 0.995,
      '40-44': 0.993,
      '45-49': 0.990,
      '50-54': 0.988,
      '55-59': 0.985,
      '60-64': 0.980,
      '65-69': 0.975,
      '70-74': 0.970,
      '75-79': 0.960,
      '80-84': 0.940,
      '85-89': 0.910,
      '90-94': 0.880,
      '95-99': 0.850
    };
    
    const annualRate = decayRates[ageGroup] || 0.98;
    return Math.pow(annualRate, yearDiff);
  }

  // JSON形式に変換
  formatToJson(year, membersByAge) {
    const result = [];
    Object.keys(membersByAge).forEach(ageGroup => {
      result.push({
        year: year,
        prefecture: '北海道',
        prefectureCode: '01',
        ageGroup: ageGroup,
        memberCount: Math.round(membersByAge[ageGroup] / 1000 * 100) / 100 // 千人単位、小数点2桁
      });
    });
    return result;
  }

  // データを保存
  saveData(year, data) {
    const filename = `coop_members_01_${year}.json`;
    const filepath = path.join(this.coopMemberDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`\n✓ ${filename} を保存しました`);
  }

  // 全年度の推計を実行
  generateAllProjections() {
    console.log('🏔️ 北海道の組合員数将来推計（コーホート方式）を開始...');
    
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    
    years.forEach(year => {
      try {
        if (year === 2025) {
          // 2025年は基準データ
          const { members2025 } = this.calculate2025ShareRates();
          const data = this.formatToJson(year, members2025);
          this.saveData(year, data);
          console.log(`\n✅ ${year}年（基準年）完了`);
        } else {
          // 2030年以降はコーホート推計
          const projectedMembers = this.projectWithCohort(year);
          const data = this.formatToJson(year, projectedMembers);
          this.saveData(year, data);
          console.log(`\n✅ ${year}年完了`);
        }
      } catch (error) {
        console.error(`\n❌ ${year}年の処理に失敗:`, error.message);
      }
    });
    
    console.log('\n🎉 北海道の組合員数推計が完了しました！');
  }
}

// スクリプト実行
if (require.main === module) {
  const generator = new HokkaidoCoopProjectionCohortGenerator();
  generator.generateAllProjections();
}

module.exports = HokkaidoCoopProjectionCohortGenerator;