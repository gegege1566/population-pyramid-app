const fs = require('fs');
const path = require('path');

// 全都道府県の人口データを取得するスクリプト

class AllPrefectureDataFetcher {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data/population');
    this.apiBaseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.appId = process.env.ESTAT_APP_ID;
    
    // 確認用
    if (!this.appId) {
      console.warn('警告: ESTAT_APP_ID環境変数が設定されていません。サンプルデータで代替します。');
    }

    // 都道府県コードマップ
    this.prefectureCodes = {
      '01': { code: '01000', name: '北海道' }, '02': { code: '02000', name: '青森県' },
      '03': { code: '03000', name: '岩手県' }, '04': { code: '04000', name: '宮城県' },
      '05': { code: '05000', name: '秋田県' }, '06': { code: '06000', name: '山形県' },
      '07': { code: '07000', name: '福島県' }, '08': { code: '08000', name: '茨城県' },
      '09': { code: '09000', name: '栃木県' }, '10': { code: '10000', name: '群馬県' },
      '11': { code: '11000', name: '埼玉県' }, '12': { code: '12000', name: '千葉県' },
      '13': { code: '13000', name: '東京都' }, '14': { code: '14000', name: '神奈川県' },
      '15': { code: '15000', name: '新潟県' }, '16': { code: '16000', name: '富山県' },
      '17': { code: '17000', name: '石川県' }, '18': { code: '18000', name: '福井県' },
      '19': { code: '19000', name: '山梨県' }, '20': { code: '20000', name: '長野県' },
      '21': { code: '21000', name: '岐阜県' }, '22': { code: '22000', name: '静岡県' },
      '23': { code: '23000', name: '愛知県' }, '24': { code: '24000', name: '三重県' },
      '25': { code: '25000', name: '滋賀県' }, '26': { code: '26000', name: '京都府' },
      '27': { code: '27000', name: '大阪府' }, '28': { code: '28000', name: '兵庫県' },
      '29': { code: '29000', name: '奈良県' }, '30': { code: '30000', name: '和歌山県' },
      '31': { code: '31000', name: '鳥取県' }, '32': { code: '32000', name: '島根県' },
      '33': { code: '33000', name: '岡山県' }, '34': { code: '34000', name: '広島県' },
      '35': { code: '35000', name: '山口県' }, '36': { code: '36000', name: '徳島県' },
      '37': { code: '37000', name: '香川県' }, '38': { code: '38000', name: '愛媛県' },
      '39': { code: '39000', name: '高知県' }, '40': { code: '40000', name: '福岡県' },
      '41': { code: '41000', name: '佐賀県' }, '42': { code: '42000', name: '長崎県' },
      '43': { code: '43000', name: '熊本県' }, '44': { code: '44000', name: '大分県' },
      '45': { code: '45000', name: '宮崎県' }, '46': { code: '46000', name: '鹿児島県' },
      '47': { code: '47000', name: '沖縄県' }
    };

    // 年齢階級マップ
    this.ageGroupMap = {
      '0201130120000010010': '0-4', '0201130120000010020': '5-9', '0201130120000010030': '10-14',
      '0201130120000010040': '15-19', '0201130120000010050': '20-24', '0201130120000010060': '25-29',
      '0201130120000010070': '30-34', '0201130120000010080': '35-39', '0201130120000010090': '40-44',
      '0201130120000010100': '45-49', '0201130120000010110': '50-54', '0201130120000010120': '55-59',
      '0201130120000010130': '60-64', '0201130120000010140': '65-69', '0201130120000010150': '70-74',
      '0201130120000010160': '75-79', '0201130120000010170': '80-84', '0201130120000010180': '85-89',
      '0201130120000010200': '90-94', '0201130120000010205': '95-99',
      // 女性
      '0201130220000010010': '0-4', '0201130220000010020': '5-9', '0201130220000010030': '10-14',
      '0201130220000010040': '15-19', '0201130220000010050': '20-24', '0201130220000010060': '25-29',
      '0201130220000010070': '30-34', '0201130220000010080': '35-39', '0201130220000010090': '40-44',
      '0201130220000010100': '45-49', '0201130220000010110': '50-54', '0201130220000010120': '55-59',
      '0201130220000010130': '60-64', '0201130220000010140': '65-69', '0201130220000010150': '70-74',
      '0201130220000010160': '75-79', '0201130220000010170': '80-84', '0201130220000010180': '85-89',
      '0201130220000010200': '90-94', '0201130220000010205': '95-99'
    };
  }

  // 性別を判定
  getGender(seriesId) {
    return seriesId.includes('012000') ? 'male' : 'female';
  }

  // API遅延
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 単一都道府県のデータを取得
  async fetchPrefectureData(prefCode, year) {
    if (!this.appId) {
      // APIキーがない場合はサンプルデータを生成
      return this.generateSampleData(prefCode, year);
    }

    const prefInfo = this.prefectureCodes[prefCode];
    if (!prefInfo) {
      throw new Error(`無効な都道府県コード: ${prefCode}`);
    }

    console.log(`${prefInfo.name}(${year}年)のデータを取得中...`);

    try {
      const url = new URL(this.apiBaseUrl);
      url.searchParams.set('appId', this.appId);
      url.searchParams.set('statsDataId', '0003448697'); // 将来推計人口
      url.searchParams.set('cdCat01', prefInfo.code);
      url.searchParams.set('cdTime', year.toString());
      url.searchParams.set('limit', '100000');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ) {
        throw new Error(`データが見つかりません: ${prefInfo.name}(${year}年)`);
      }

      return this.parseApiData(data, prefCode, year);
      
    } catch (error) {
      console.error(`${prefInfo.name}(${year}年)の取得に失敗:`, error.message);
      // エラー時はサンプルデータで代替
      return this.generateSampleData(prefCode, year);
    }
  }

  // APIレスポンスをパース
  parseApiData(data, prefCode, year) {
    const result = [];
    const items = data.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ;
    const prefInfo = this.prefectureCodes[prefCode];

    items.forEach(item => {
      const seriesId = item.VALUE['@indicator'];
      const ageGroup = this.ageGroupMap[seriesId];
      
      if (ageGroup) {
        const gender = this.getGender(seriesId);
        const population = parseInt(item.VALUE.$) || 0;

        result.push({
          year: parseInt(year),
          prefecture: prefInfo.name,
          prefectureCode: prefCode,
          ageGroup,
          gender,
          population
        });
      }
    });

    return result;
  }

  // サンプルデータを生成（APIが利用できない場合）
  generateSampleData(prefCode, year) {
    const prefInfo = this.prefectureCodes[prefCode];
    const result = [];
    
    const ageGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    const genders = ['male', 'female'];

    // 都道府県コードに基づく基準人口（千人単位）
    const basePopulations = {
      '01': 5200, '13': 14000, '23': 7500, '27': 8800, // 大都市
      '02': 1200, '03': 1200, '05': 950, '06': 1100, // 地方
    };
    
    const basePopulation = basePopulations[prefCode] || 2000;

    ageGroups.forEach(ageGroup => {
      genders.forEach(gender => {
        // 年齢階級による人口分布の調整
        let populationFactor = 1.0;
        if (['0-4', '5-9', '10-14'].includes(ageGroup)) {
          populationFactor = 0.8; // 少子化
        } else if (['65-69', '70-74', '75-79'].includes(ageGroup)) {
          populationFactor = 1.3; // 高齢化
        } else if (['80-84', '85-89', '90-94', '95-99'].includes(ageGroup)) {
          populationFactor = 0.7; // 超高齢
        }

        // 年度による減少調整
        const yearFactor = year <= 2025 ? 1.0 : 1.0 - ((year - 2025) * 0.01);

        const population = Math.round(
          (basePopulation / 40) * populationFactor * yearFactor * (Math.random() * 0.4 + 0.8)
        );

        result.push({
          year: parseInt(year),
          prefecture: prefInfo.name,
          prefectureCode: prefCode,
          ageGroup,
          gender,
          population: Math.max(1, population)
        });
      });
    });

    return result;
  }

  // 全都道府県のデータを取得
  async fetchAllPrefectures(year) {
    console.log(`\n${year}年の全都道府県データ取得を開始...`);
    
    const allData = {};
    const prefCodes = Object.keys(this.prefectureCodes);
    let completed = 0;

    for (const prefCode of prefCodes) {
      try {
        const data = await this.fetchPrefectureData(prefCode, year);
        allData[prefCode] = data;
        completed++;
        
        console.log(`進捗: ${completed}/${prefCodes.length} (${this.prefectureCodes[prefCode].name})`);
        
        // API制限回避のため1秒待機
        if (this.appId) {
          await this.delay(1000);
        }
        
      } catch (error) {
        console.error(`${this.prefectureCodes[prefCode].name}のデータ取得に失敗:`, error.message);
      }
    }

    return allData;
  }

  // データをファイルに保存
  async saveData(year, data) {
    const filename = `population_${year}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ ${filename} を保存しました`);
  }

  // 全年度のデータを取得
  async fetchAllYears() {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    
    for (const year of years) {
      try {
        const data = await this.fetchAllPrefectures(year);
        await this.saveData(year, data);
        
        console.log(`✓ ${year}年のデータ取得完了\n`);
        
      } catch (error) {
        console.error(`✗ ${year}年のデータ取得に失敗:`, error.message);
      }
    }
  }

  // 特定年度のみ取得
  async fetchYear(year) {
    try {
      const data = await this.fetchAllPrefectures(year);
      await this.saveData(year, data);
      console.log(`✓ ${year}年のデータ取得完了`);
    } catch (error) {
      console.error(`✗ ${year}年のデータ取得に失敗:`, error.message);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const fetcher = new AllPrefectureDataFetcher();
  
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const year = parseInt(args[0]);
    if (year && year >= 2020 && year <= 2060) {
      console.log(`${year}年のデータを取得します...`);
      fetcher.fetchYear(year);
    } else {
      console.error('有効な年度を指定してください (2020-2060)');
      process.exit(1);
    }
  } else {
    console.log('全年度のデータを取得します...');
    fetcher.fetchAllYears();
  }
}

module.exports = AllPrefectureDataFetcher;