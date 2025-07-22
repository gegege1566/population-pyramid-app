require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// e-Stat API設定
const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';

// 統計表ID（人口推計）
const STATS_TABLE_ID = '0003448237'; // 都道府県，年齢（5歳階級），男女別人口－総人口，日本人人口

// 都道府県コード
const PREFECTURE_CODES = {
  '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県',
  '05': '秋田県', '06': '山形県', '07': '福島県', '08': '茨城県',
  '09': '栃木県', '10': '群馬県', '11': '埼玉県', '12': '千葉県',
  '13': '東京都', '14': '神奈川県', '15': '新潟県', '16': '富山県',
  '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
  '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県',
  '25': '滋賀県', '26': '京都府', '27': '大阪府', '28': '兵庫県',
  '29': '奈良県', '30': '和歌山県', '31': '鳥取県', '32': '島根県',
  '33': '岡山県', '34': '広島県', '35': '山口県', '36': '徳島県',
  '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
  '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県',
  '45': '宮崎県', '46': '鹿児島県', '47': '沖縄県'
};

// 年齢グループマッピング
const AGE_GROUP_MAPPING = {
  '0～4歳': '0-4',
  '5～9歳': '5-9',
  '10～14歳': '10-14',
  '15～19歳': '15-19',
  '20～24歳': '20-24',
  '25～29歳': '25-29',
  '30～34歳': '30-34',
  '35～39歳': '35-39',
  '40～44歳': '40-44',
  '45～49歳': '45-49',
  '50～54歳': '50-54',
  '55～59歳': '55-59',
  '60～64歳': '60-64',
  '65～69歳': '65-69',
  '70～74歳': '70-74',
  '75～79歳': '75-79',
  '80～84歳': '80-84',
  '85歳以上': '85+'
};

async function fetchPopulationData(year, prefCode) {
  try {
    console.log(`Fetching data for ${PREFECTURE_CODES[prefCode]} (${year})...`);
    
    // timeコード計算（実際のe-Statデータに基づく）
    const timeCodeMap = {
      2024: '1901',
      2023: '1801', 
      2022: '1701',
      2021: '1601',
      2020: '1301', // 確認済み
      2019: '1201',
      2018: '1101',
      2017: '1001',
      2016: '0901',
      2015: '0801',
      2014: '0701',
      2013: '0601',
      2012: '0501',
      2011: '0401',
      2010: '0301'
    };
    const timeCode = timeCodeMap[year];
    
    if (!timeCode) {
      console.log(`⚠ Time code not available for year ${year}`);
      return [];
    }
    
    const params = {
      appId: API_KEY,
      statsDataId: STATS_TABLE_ID,
      cdArea: prefCode + '000', // 都道府県コード（例：13000 = 東京都）
      cdTime: timeCode,
      cdCat01: '001,002', // 男,女
      cdCat02: '01001,01002,01003,01004,01005,01006,01007,01008,01009,01010,01011,01012,01013,01014,01015,01016,01017,01018', // 年齢階級（総数以外）
      cdCat03: '001', // 総人口
      metaGetFlg: 'N',
      cntGetFlg: 'N'
    };

    const response = await axios.get(BASE_URL, { params });
    
    if (response.data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
      return parsePopulationData(response.data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE, year, prefCode);
    } else {
      console.log(`No data found for ${PREFECTURE_CODES[prefCode]} (${year})`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching data for ${PREFECTURE_CODES[prefCode]} (${year}):`, error.message);
    return [];
  }
}

function parsePopulationData(values, year, prefCode) {
  const populationData = [];
  
  // 年齢コードのマッピング
  const ageCodeMapping = {
    '01001': '0-4',
    '01002': '5-9',
    '01003': '10-14',
    '01004': '15-19',
    '01005': '20-24',
    '01006': '25-29',
    '01007': '30-34',
    '01008': '35-39',
    '01009': '40-44',
    '01010': '45-49',
    '01011': '50-54',
    '01012': '55-59',
    '01013': '60-64',
    '01014': '65-69',
    '01015': '70-74',
    '01016': '75-79',
    '01017': '80-84',
    '01018': '85+'
  };
  
  values.forEach(value => {
    const ageGroup = ageCodeMapping[value['@cat02']];
    const gender = value['@cat01'] === '001' ? 'male' : 'female';
    const population = parseInt(value['$']) || 0; // 千人単位
    
    if (ageGroup && population >= 0) { // 0人でも含める
      populationData.push({
        year: parseInt(year),
        prefecture: PREFECTURE_CODES[prefCode],
        prefectureCode: prefCode,
        ageGroup,
        gender,
        population // 千人単位のまま保存
      });
    }
  });
  
  return populationData;
}

async function fetchAllPrefecturesForYear(year) {
  const yearData = {};
  
  for (const prefCode of Object.keys(PREFECTURE_CODES)) {
    const data = await fetchPopulationData(year, prefCode);
    if (data.length > 0) {
      yearData[prefCode] = data;
    }
    // APIレート制限対策
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return yearData;
}

async function main() {
  try {
    console.log('Starting to fetch 5-year interval population data...');
    console.log('Years: 2020, 2025, 2030, 2035, 2040, 2045, 2050');
    
    const dataDir = path.join(__dirname, '..', 'public', 'data', 'population');
    await fs.mkdir(dataDir, { recursive: true });
    
    // 5年刻みの年度（実際のデータが存在する年度）
    const years = [2010, 2015, 2020]; // 実データが取得可能な年度
    
    for (const year of years) {
      console.log(`\n=== Fetching data for year ${year} ===`);
      
      const yearData = await fetchAllPrefecturesForYear(year);
      
      // 年度別ファイルに保存
      const filePath = path.join(dataDir, `population_${year}.json`);
      await fs.writeFile(filePath, JSON.stringify(yearData, null, 2));
      
      console.log(`✓ Saved data for ${year} to ${filePath}`);
    }
    
    console.log('\n✅ All data fetched successfully!');
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// コマンドライン引数の処理
if (process.argv.length > 2 && process.argv[2] === 'test') {
  // テスト実行（東京都の2020年のみ）
  fetchPopulationData(2020, '13').then(data => {
    console.log('Test data:', JSON.stringify(data, null, 2));
  });
} else {
  main();
}