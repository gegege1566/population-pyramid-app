const fs = require('fs');
const path = require('path');

// 北海道専用組合員数将来推計データ生成スクリプト

class HokkaidoCoopProjectionGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.coopMemberDir = path.join(this.dataDir, 'coop-members');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.coopMemberDir)) {
      fs.mkdirSync(this.coopMemberDir, { recursive: true });
    }

    // 北海道の基準組合員数（2025年）
    this.hokkaido2025Members = 2000000; // 正しい値に修正
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

  // 年齢階級別の組合員シェア率を計算（2025年基準）
  calculateBaseShareRates() {
    const pop2025 = this.loadPopulationData(2025);
    
    // 年齢階級別の人口を集計
    const ageGroupPop = {};
    pop2025.forEach(item => {
      const ageGroup = item.ageGroup;
      if (!ageGroupPop[ageGroup]) {
        ageGroupPop[ageGroup] = 0;
      }
      ageGroupPop[ageGroup] += item.population * 1000; // 千人単位を人単位に変換
    });

    // 年齢階級別の組合員数を推定（年齢に応じた分布）
    // 北海道の組合員2,000,000人に対する現実的な年齢分布（全年齢階級でシェア率80%未満）
    const ageDistribution = {
      '0-4': 0.0, '5-9': 0.0, '10-14': 0.0, '15-19': 0.0,
      '20-24': 0.010, '25-29': 0.025, '30-34': 0.045, '35-39': 0.065,
      '40-44': 0.085, '45-49': 0.100, '50-54': 0.105, '55-59': 0.120,
      '60-64': 0.110, '65-69': 0.110, '70-74': 0.085, '75-79': 0.055,
      '80-84': 0.030, '85-89': 0.015, '90-94': 0.007, '95-99': 0.003
    };

    const shareRates = {};
    let totalEstimatedMembers = 0;

    // 各年齢階級の推定組合員数を計算
    Object.keys(ageDistribution).forEach(ageGroup => {
      if (ageGroupPop[ageGroup]) {
        const estimatedMembers = this.hokkaido2025Members * ageDistribution[ageGroup];
        shareRates[ageGroup] = estimatedMembers / ageGroupPop[ageGroup];
        totalEstimatedMembers += estimatedMembers;
      } else {
        shareRates[ageGroup] = 0;
      }
    });

    // 合計が実際の組合員数になるよう調整
    const adjustmentFactor = this.hokkaido2025Members / totalEstimatedMembers;
    Object.keys(shareRates).forEach(ageGroup => {
      shareRates[ageGroup] *= adjustmentFactor;
    });

    console.log('北海道の年齢階級別組合員シェア率:');
    Object.keys(shareRates).forEach(ageGroup => {
      if (shareRates[ageGroup] > 0.001) {
        console.log(`  ${ageGroup}: ${(shareRates[ageGroup] * 100).toFixed(2)}%`);
      }
    });

    return shareRates;
  }

  // 将来年度の組合員数推計
  generateProjection(year) {
    console.log(`北海道の${year}年組合員数推計を開始...`);
    
    const shareRates = this.calculateBaseShareRates();
    const populationData = this.loadPopulationData(year);
    
    // 年齢階級別の人口を集計
    const ageGroupPop = {};
    populationData.forEach(item => {
      const ageGroup = item.ageGroup;
      if (!ageGroupPop[ageGroup]) {
        ageGroupPop[ageGroup] = 0;
      }
      ageGroupPop[ageGroup] += item.population; // 既に千人単位
    });

    // 年齢階級別組合員数を計算
    const coopMembers = [];
    let totalMembers = 0;

    Object.keys(shareRates).forEach(ageGroup => {
      const population = ageGroupPop[ageGroup] || 0;
      let memberCount = 0;

      if (population > 0 && shareRates[ageGroup] > 0) {
        // 35歳未満はシェア率を維持
        if (this.isYoungAgeGroup(ageGroup)) {
          memberCount = population * shareRates[ageGroup];
        } else {
          // 35歳以上は減衰率を適用
          const decayFactor = this.getDecayFactor(year, ageGroup);
          memberCount = population * shareRates[ageGroup] * decayFactor;
        }
      }

      coopMembers.push({
        year: year,
        prefecture: '北海道',
        prefectureCode: '01',
        ageGroup: ageGroup,
        memberCount: Math.round(memberCount * 100) / 100 // 小数点2桁で丸め
      });

      totalMembers += memberCount;
    });

    console.log(`✓ 北海道 ${year}年 総組合員数: ${Math.round(totalMembers * 1000).toLocaleString()}人`);
    
    return coopMembers;
  }

  // 若年層判定（35歳未満）
  isYoungAgeGroup(ageGroup) {
    const youngGroups = ['20-24', '25-29', '30-34'];
    return youngGroups.includes(ageGroup);
  }

  // 年齢階級・年度別の減衰率
  getDecayFactor(year, ageGroup) {
    const baseYear = 2025;
    const yearDiff = year - baseYear;
    
    // 年齢階級別の年間減衰率
    const decayRates = {
      '35-39': 0.015, '40-44': 0.015, '45-49': 0.012, '50-54': 0.010,
      '55-59': 0.008, '60-64': 0.006, '65-69': 0.005, '70-74': 0.008,
      '75-79': 0.012, '80-84': 0.015, '85-89': 0.018, '90-94': 0.020, '95-99': 0.025
    };
    
    const rate = decayRates[ageGroup] || 0.010;
    return Math.pow(1 - rate, yearDiff);
  }

  // データをファイルに保存
  saveData(year, data) {
    const filename = `coop_members_01_${year}.json`;
    const filepath = path.join(this.coopMemberDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ ${filename} を保存しました`);
  }

  // 全年度の推計を生成
  generateAllProjections() {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    
    console.log('🏔️ 北海道の組合員数将来推計を開始...\n');
    
    years.forEach(year => {
      try {
        if (year === 2025) {
          // 2025年は基準年度として既存データを使用
          const baseData = this.generate2025BaseData();
          this.saveData(year, baseData);
        } else {
          const projectionData = this.generateProjection(year);
          this.saveData(year, projectionData);
        }
        console.log(`✅ ${year}年完了\n`);
      } catch (error) {
        console.error(`❌ ${year}年の処理に失敗:`, error.message);
      }
    });
    
    console.log('🎉 北海道の組合員数推計が完了しました！');
  }

  // 2025年基準データ生成
  generate2025BaseData() {
    const shareRates = this.calculateBaseShareRates();
    const populationData = this.loadPopulationData(2025);
    
    // 年齢階級別の人口を集計
    const ageGroupPop = {};
    populationData.forEach(item => {
      const ageGroup = item.ageGroup;
      if (!ageGroupPop[ageGroup]) {
        ageGroupPop[ageGroup] = 0;
      }
      ageGroupPop[ageGroup] += item.population;
    });

    // 組合員数を計算
    const coopMembers = [];
    Object.keys(shareRates).forEach(ageGroup => {
      const population = ageGroupPop[ageGroup] || 0;
      const memberCount = population * shareRates[ageGroup];

      coopMembers.push({
        year: 2025,
        prefecture: '北海道',
        prefectureCode: '01',
        ageGroup: ageGroup,
        memberCount: Math.round(memberCount * 100) / 100
      });
    });

    return coopMembers;
  }
}

// スクリプト実行
if (require.main === module) {
  const generator = new HokkaidoCoopProjectionGenerator();
  generator.generateAllProjections();
}

module.exports = HokkaidoCoopProjectionGenerator;