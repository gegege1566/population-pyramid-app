const fs = require('fs');
const path = require('path');

// 全都道府県対応組合員数将来推計データ生成スクリプト

class AllCoopMemberProjectionGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.coopMemberDir = path.join(this.dataDir, 'coop-members');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.coopMemberDir)) {
      fs.mkdirSync(this.coopMemberDir, { recursive: true });
    }

    // 基準年度の組合員データ（2025年）
    this.baseMemberData = this.loadBaseMemberData();
    this.prefectureMap = this.createPrefectureMap();
  }

  // 基準年度の組合員データを読み込み
  loadBaseMemberData() {
    // 実際の組合員数データ（人）
    const prefectureMembers = new Map([
      ['00000', 20491000], // 全国
      ['01', 2000000], // 北海道
      ['02', 161337], // 青森県
      ['03', 292156], // 岩手県
      ['04', 982602], // 宮城県
      ['05', 170000], // 秋田県
      ['06', 162062], // 山形県
      ['07', 346000], // 福島県
      ['08', 410000], // 茨城県
      ['09', 284000], // 栃木県
      ['10', 357000], // 群馬県
      ['11', 720000], // 埼玉県
      ['12', 610000], // 千葉県
      ['13', 2579432], // 東京都
      ['14', 1380000], // 神奈川県
      ['15', 243000], // 新潟県
      ['16', 85000], // 富山県
      ['17', 135000], // 石川県
      ['18', 360000], // 福井県
      ['19', 80000], // 山梨県
      ['20', 342000], // 長野県
      ['21', 290000], // 岐阜県
      ['22', 290000], // 静岡県
      ['23', 750000], // 愛知県
      ['24', 210000], // 三重県
      ['25', 140000], // 滋賀県
      ['26', 440000], // 京都府
      ['27', 900000], // 大阪府
      ['28', 1712578], // 兵庫県
      ['29', 265000], // 奈良県
      ['30', 140000], // 和歌山県
      ['31', 45000], // 鳥取県
      ['32', 65000], // 島根県
      ['33', 343070], // 岡山県
      ['34', 340000], // 広島県
      ['35', 200000], // 山口県
      ['36', 60000], // 徳島県
      ['37', 240000], // 香川県
      ['38', 240000], // 愛媛県
      ['39', 70000], // 高知県
      ['40', 566000], // 福岡県
      ['41', 70000], // 佐賀県
      ['42', 225000], // 長崎県
      ['43', 149000], // 熊本県
      ['44', 186000], // 大分県
      ['45', 271806], // 宮崎県
      ['46', 343000], // 鹿児島県
      ['47', 240000] // 沖縄県
    ]);

    // 年齢構成比（％）
    const ageComposition = [
      { ageGroup: '20-24', percentage: 0.66 },
      { ageGroup: '25-29', percentage: 0.74 },
      { ageGroup: '30-34', percentage: 3.95 },
      { ageGroup: '35-39', percentage: 4.45 },
      { ageGroup: '40-44', percentage: 7.31 },
      { ageGroup: '45-49', percentage: 7.89 },
      { ageGroup: '50-54', percentage: 10.86 },
      { ageGroup: '55-59', percentage: 11.04 },
      { ageGroup: '60-64', percentage: 12.37 },
      { ageGroup: '65-69', percentage: 11.43 },
      { ageGroup: '70-74', percentage: 11.40 },
      { ageGroup: '75-79', percentage: 9.90 },
      { ageGroup: '80-84', percentage: 3.85 },
      { ageGroup: '85-89', percentage: 2.47 },
      { ageGroup: '90-94', percentage: 1.20 },
      { ageGroup: '95-99', percentage: 0.38 }
    ];

    return { prefectureMembers, ageComposition };
  }

  // 都道府県マップを作成
  createPrefectureMap() {
    return {
      '00000': '全国',
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

  // 人口データを読み込み（全国または都道府県別）
  loadPopulationData(year, prefectureCode = null) {
    let filepath;
    let data;
    
    if (prefectureCode === '00000' || prefectureCode === null) {
      // 全国データを読み込み
      filepath = path.join(this.populationDir, `population_national_${year}.json`);
      if (!fs.existsSync(filepath)) {
        throw new Error(`National population data not found: ${filepath}`);
      }
      data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return data;
    } else {
      // 都道府県別データを読み込み
      filepath = path.join(this.populationDir, `population_${year}.json`);
      if (!fs.existsSync(filepath)) {
        throw new Error(`Prefecture population data not found: ${filepath}`);
      }
      
      const allData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // JSONの構造を確認して適切にデータを抽出
      if (allData[prefectureCode]) {
        // {"13": [...], "14": [...]} 形式の場合
        return allData[prefectureCode];
      } else if (Array.isArray(allData)) {
        // 配列形式の場合、該当する都道府県のデータをフィルタ
        return allData.filter(item => item.prefectureCode === prefectureCode);
      } else {
        throw new Error(`Invalid data format or prefecture code not found: ${prefectureCode}`);
      }
    }
  }

  // 基準年のシェア率を計算
  calculateBaseShareRates(prefectureCode) {
    const basePopulation = this.loadPopulationData(2025, prefectureCode);
    const shareRates = new Map();

    const totalMembers = this.baseMemberData.prefectureMembers.get(prefectureCode);
    if (!totalMembers) {
      console.warn(`組合員データが見つかりません: ${prefectureCode}`);
      return shareRates;
    }

    const prefShareRates = new Map();

    this.baseMemberData.ageComposition.forEach(comp => {
      // 組合員数（千人単位）
      const memberCount = (totalMembers * comp.percentage / 100) / 1000;
      
      // 対応する人口データ（男女合計）
      const maleData = basePopulation.find(p => 
        p.prefectureCode === prefectureCode && 
        p.ageGroup === comp.ageGroup && 
        p.gender === 'male'
      );
      const femaleData = basePopulation.find(p => 
        p.prefectureCode === prefectureCode && 
        p.ageGroup === comp.ageGroup && 
        p.gender === 'female'
      );

      if (maleData && femaleData) {
        // データの単位調整
        let totalPopulation;
        if (prefectureCode === '00000') {
          // 全国データは実人数なので千人単位に変換
          totalPopulation = (maleData.population + femaleData.population) / 1000;
        } else {
          // 都道府県データは千人単位データ
          totalPopulation = maleData.population + femaleData.population;
        }
        
        const shareRate = totalPopulation > 0 ? memberCount / totalPopulation : 0;
        prefShareRates.set(comp.ageGroup, shareRate);
      }
    });

    shareRates.set(prefectureCode, prefShareRates);
    return shareRates;
  }

  // 減衰率を計算
  calculateDecayRate(fromAgeGroup, toAgeGroup, fromYear, toYear, prefectureCode) {
    const fromPopulation = this.loadPopulationData(fromYear, prefectureCode);
    const toPopulation = this.loadPopulationData(toYear, prefectureCode);
    
    // 該当都道府県データから減衰率を計算
    const fromMale = fromPopulation.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === fromAgeGroup && 
      p.gender === 'male'
    );
    const fromFemale = fromPopulation.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === fromAgeGroup && 
      p.gender === 'female'
    );
    
    const toMale = toPopulation.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === toAgeGroup && 
      p.gender === 'male'
    );
    const toFemale = toPopulation.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === toAgeGroup && 
      p.gender === 'female'
    );

    if (fromMale && fromFemale && toMale && toFemale) {
      const fromTotal = fromMale.population + fromFemale.population;
      const toTotal = toMale.population + toFemale.population;
      return fromTotal > 0 ? toTotal / fromTotal : 0;
    }
    
    return 0;
  }

  // 前の年齢階層を取得
  getPreviousAgeGroup(ageGroup) {
    const ageGroupMap = {
      '25-29': '20-24',
      '30-34': '25-29',
      '35-39': '30-34',
      '40-44': '35-39',
      '45-49': '40-44',
      '50-54': '45-49',
      '55-59': '50-54',
      '60-64': '55-59',
      '65-69': '60-64',
      '70-74': '65-69',
      '75-79': '70-74',
      '80-84': '75-79',
      '85-89': '80-84',
      '90-94': '85-89',
      '95-99': '90-94'
    };
    
    return ageGroupMap[ageGroup] || null;
  }

  // 将来年度の組合員数を推計
  generateProjection(targetYear, prefectureCode) {
    console.log(`${this.prefectureMap[prefectureCode]}(${targetYear}年)の組合員数推計を開始...`);
    
    const baseShareRates = this.calculateBaseShareRates(prefectureCode);
    const targetPopulation = this.loadPopulationData(targetYear, prefectureCode);
    const youngAgeGroups = ['20-24', '25-29', '30-34', '35-39'];
    
    // 全年齢階層
    const allAgeGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    const projectionData = [];
    const shareRates = baseShareRates.get(prefectureCode);

    if (!shareRates) {
      console.warn(`シェア率データが見つかりません: ${prefectureCode}`);
      return [];
    }

    // 基準年度の組合員データを取得（中高年層の繰り上がり計算用）
    const baseMembersByAge = new Map();
    this.baseMemberData.ageComposition.forEach(comp => {
      const totalMembers = this.baseMemberData.prefectureMembers.get(prefectureCode);
      if (totalMembers) {
        const memberCount = (totalMembers * comp.percentage / 100) / 1000;
        baseMembersByAge.set(comp.ageGroup, memberCount);
      }
    });

    allAgeGroups.forEach(ageGroup => {
      let memberCount = 0;

      // 20歳未満は0
      if (['0-4', '5-9', '10-14', '15-19'].includes(ageGroup)) {
        memberCount = 0;
      }
      // 若年層：シェア率維持
      else if (youngAgeGroups.includes(ageGroup)) {
        const maleData = targetPopulation.find(p => 
          p.prefectureCode === prefectureCode && 
          p.ageGroup === ageGroup && 
          p.gender === 'male'
        );
        const femaleData = targetPopulation.find(p => 
          p.prefectureCode === prefectureCode && 
          p.ageGroup === ageGroup && 
          p.gender === 'female'
        );

        if (maleData && femaleData) {
          let totalPopulation;
          if (prefectureCode === '00000') {
            // 全国データは実人数なので千人単位に変換
            totalPopulation = (maleData.population + femaleData.population) / 1000;
          } else {
            // 都道府県データは千人単位データ
            totalPopulation = maleData.population + femaleData.population;
          }
          
          const shareRate = shareRates.get(ageGroup) || 0;
          memberCount = totalPopulation * shareRate;
        }
      }
      // 中高年層：繰り上がり + 減衰
      else {
        const previousAgeGroup = this.getPreviousAgeGroup(ageGroup);
        if (previousAgeGroup) {
          const baseMemberCount = baseMembersByAge.get(previousAgeGroup) || 0;
          const decayRate = this.calculateDecayRate(previousAgeGroup, ageGroup, 2025, targetYear, prefectureCode);
          memberCount = baseMemberCount * decayRate;
        }
      }

      projectionData.push({
        year: targetYear,
        prefecture: this.prefectureMap[prefectureCode],
        prefectureCode,
        ageGroup,
        memberCount: Math.round(memberCount * 10) / 10
      });
    });

    return projectionData;
  }

  // すべての将来年度・都道府県の推計を実行
  generateAllProjections() {
    const futureYears = [2030, 2035, 2040, 2045, 2050];
    const prefectureCodes = Array.from(this.baseMemberData.prefectureMembers.keys());
    
    futureYears.forEach(year => {
      prefectureCodes.forEach(prefectureCode => {
        try {
          const projectionData = this.generateProjection(year, prefectureCode);
          
          if (projectionData.length > 0) {
            // ファイル保存
            const prefName = prefectureCode === '00000' ? 'national' : prefectureCode;
            const filename = `coop_members_${prefName}_${year}.json`;
            const filepath = path.join(this.coopMemberDir, filename);
            fs.writeFileSync(filepath, JSON.stringify(projectionData, null, 2));
            
            console.log(`✓ ${this.prefectureMap[prefectureCode]}(${year}年)のデータを保存: ${filename}`);
          }
        } catch (error) {
          console.error(`✗ ${this.prefectureMap[prefectureCode]}(${year}年)の推計でエラー:`, error.message);
        }
      });
    });
  }

  // 特定の都道府県のみ推計
  generatePrefectureProjections(prefectureCode) {
    const futureYears = [2030, 2035, 2040, 2045, 2050];
    
    futureYears.forEach(year => {
      try {
        const projectionData = this.generateProjection(year, prefectureCode);
        
        if (projectionData.length > 0) {
          // ファイル保存
          const prefName = prefectureCode === '00000' ? 'national' : prefectureCode;
          const filename = `coop_members_${prefName}_${year}.json`;
          const filepath = path.join(this.coopMemberDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(projectionData, null, 2));
          
          console.log(`✓ ${this.prefectureMap[prefectureCode]}(${year}年)のデータを保存: ${filename}`);
        }
      } catch (error) {
        console.error(`✗ ${this.prefectureMap[prefectureCode]}(${year}年)の推計でエラー:`, error.message);
      }
    });
  }
}

// スクリプト実行
if (require.main === module) {
  const generator = new AllCoopMemberProjectionGenerator();
  
  // コマンドライン引数で都道府県を指定可能
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const prefectureCode = args[0];
    console.log(`${generator.prefectureMap[prefectureCode] || prefectureCode}の組合員数将来推計を開始...`);
    generator.generatePrefectureProjections(prefectureCode);
  } else {
    console.log('全都道府県の組合員数将来推計を開始...');
    generator.generateAllProjections();
  }
  
  console.log('組合員数将来推計データの生成が完了しました');
}

module.exports = AllCoopMemberProjectionGenerator;