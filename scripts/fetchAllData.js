const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY || '';
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

const PREFECTURE_CODES = {
  '01': '北海道',   '02': '青森県',   '03': '岩手県',   '04': '宮城県',
  '05': '秋田県',   '06': '山形県',   '07': '福島県',   '08': '茨城県',
  '09': '栃木県',   '10': '群馬県',   '11': '埼玉県',   '12': '千葉県',
  '13': '東京都',   '14': '神奈川県', '15': '新潟県',   '16': '富山県',
  '17': '石川県',   '18': '福井県',   '19': '山梨県',   '20': '長野県',
  '21': '岐阜県',   '22': '静岡県',   '23': '愛知県',   '24': '三重県',
  '25': '滋賀県',   '26': '京都府',   '27': '大阪府',   '28': '兵庫県',
  '29': '奈良県',   '30': '和歌山県', '31': '鳥取県',   '32': '島根県',
  '33': '岡山県',   '34': '広島県',   '35': '山口県',   '36': '徳島県',
  '37': '香川県',   '38': '愛媛県',   '39': '高知県',   '40': '福岡県',
  '41': '佐賀県',   '42': '長崎県',   '43': '熊本県',   '44': '大分県',
  '45': '宮崎県',   '46': '鹿児島県', '47': '沖縄県'
};

const TIME_CODES = {
  2020: '1601',
  2021: '1301', 
  2022: '1701',
  2023: '1801',
  2024: '1901'
};

class DataFetcher {
  constructor() {
    this.delay = 200; // API制限を避けるための待機時間
    this.dataDir = path.join(__dirname, '..', 'src', 'data', 'population');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPopulationData(prefCode, year) {
    try {
      const response = await axios.get(`${BASE_URL}/json/getStatsData`, {
        params: {
          appId: API_KEY,
          statsDataId: '0003448237',
          metaGetFlg: 'Y',
          cntGetFlg: 'N',
          cdCat01: '001,002', // 男性・女性のみ（男女計を除外）
          cdCat03: '001',     // 総人口
          cdArea: `${prefCode}000`,
          cdTime: TIME_CODES[year]
        },
        timeout: 20000
      });

      if (response.data.GET_STATS_DATA?.RESULT?.STATUS !== 0) {
        throw new Error(`API Error: ${response.data.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
      }

      return this.transformData(response.data, prefCode, year);
    } catch (error) {
      console.error(`Error fetching ${prefCode}-${year}:`, error.message);
      return [];
    }
  }

  transformData(apiResponse, prefCode, year) {
    const values = apiResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    const classInfo = apiResponse.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ || [];
    
    const genderMapping = this.buildMapping(classInfo, '男女別');
    const ageMapping = this.buildMapping(classInfo, '年齢5歳階級');
    
    return values
      .map(value => ({
        year: year,
        prefecture: PREFECTURE_CODES[prefCode],
        prefectureCode: prefCode,
        ageGroup: this.convertAgeCode(value['@cat02'], ageMapping[value['@cat02']]),
        gender: value['@cat01'] === '001' ? 'male' : 'female',
        population: parseInt(value['$'] || '0', 10)
      }))
      .filter(item => item.population > 0 && item.ageGroup !== 'unknown');
  }

  buildMapping(classInfo, keyword) {
    const targetClass = classInfo.find(c => c['@name'].includes(keyword));
    const mapping = {};
    
    if (targetClass?.CLASS) {
      const items = Array.isArray(targetClass.CLASS) ? targetClass.CLASS : [targetClass.CLASS];
      items.forEach(item => {
        mapping[item['@code']] = item['@name'];
      });
    }
    
    return mapping;
  }

  convertAgeCode(code, name) {
    if (!name) return 'unknown';
    
    if (name.includes('85歳以上')) return '85+';
    
    const match = name.match(/(\d+)～(\d+)歳/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return 'unknown';
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchAllData() {
    console.log('Starting data fetch process...');
    this.ensureDataDirectory();

    const years = [2020, 2021, 2022, 2023, 2024];
    const prefCodes = Object.keys(PREFECTURE_CODES);
    const allData = {};

    let totalRequests = years.length * prefCodes.length;
    let completedRequests = 0;

    for (const year of years) {
      console.log(`\\n=== Fetching data for ${year} ===`);
      const yearData = {};

      for (const prefCode of prefCodes) {
        const prefName = PREFECTURE_CODES[prefCode];
        console.log(`Fetching: ${prefName} (${prefCode}) - ${year} [${completedRequests + 1}/${totalRequests}]`);
        
        const data = await this.fetchPopulationData(prefCode, year);
        yearData[prefCode] = data;
        
        completedRequests++;
        const progress = ((completedRequests / totalRequests) * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${data.length} records)`);
        
        // API制限を避けるため待機
        await this.sleep(this.delay);
      }

      // 年別データを保存
      const yearFile = path.join(this.dataDir, `population_${year}.json`);
      fs.writeFileSync(yearFile, JSON.stringify(yearData, null, 2));
      console.log(`Saved: ${yearFile}`);

      allData[year] = yearData;
    }

    // 全データを統合して保存
    const allDataFile = path.join(this.dataDir, 'population_all.json');
    fs.writeFileSync(allDataFile, JSON.stringify(allData, null, 2));
    console.log(`\\nAll data saved to: ${allDataFile}`);

    // 統計情報を出力
    this.generateStats(allData);
  }

  generateStats(allData) {
    console.log('\\n=== Data Statistics ===');
    
    for (const [year, yearData] of Object.entries(allData)) {
      const totalRecords = Object.values(yearData).reduce((sum, prefData) => sum + prefData.length, 0);
      const prefCount = Object.keys(yearData).length;
      console.log(`${year}: ${prefCount} prefectures, ${totalRecords} records`);
    }

    const totalSize = JSON.stringify(allData).length;
    console.log(`\\nTotal data size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  async fetchSpecificPrefecture(prefCode, years = [2020, 2021, 2022, 2023, 2024]) {
    console.log(`Fetching data for ${PREFECTURE_CODES[prefCode]} (${prefCode})`);
    
    const prefData = {};
    for (const year of years) {
      console.log(`Fetching ${prefCode} - ${year}`);
      prefData[year] = await this.fetchPopulationData(prefCode, year);
      await this.sleep(this.delay);
    }

    this.ensureDataDirectory();
    const prefFile = path.join(this.dataDir, `prefecture_${prefCode}.json`);
    fs.writeFileSync(prefFile, JSON.stringify(prefData, null, 2));
    console.log(`Saved: ${prefFile}`);

    return prefData;
  }
}

// CLI実行
async function main() {
  if (!API_KEY) {
    console.error('Error: REACT_APP_ESTAT_API_KEY environment variable is required');
    console.log('Please set your e-Stat API key:');
    console.log('export REACT_APP_ESTAT_API_KEY="your-api-key"');
    process.exit(1);
  }

  const fetcher = new DataFetcher();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 全データ取得
    await fetcher.fetchAllData();
  } else if (args[0] === 'pref' && args[1]) {
    // 特定都道府県のデータ取得
    const prefCode = args[1].padStart(2, '0');
    if (PREFECTURE_CODES[prefCode]) {
      await fetcher.fetchSpecificPrefecture(prefCode);
    } else {
      console.error(`Invalid prefecture code: ${prefCode}`);
    }
  } else {
    console.log('Usage:');
    console.log('  node fetchAllData.js           # Fetch all data');
    console.log('  node fetchAllData.js pref 13   # Fetch Tokyo data only');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataFetcher;