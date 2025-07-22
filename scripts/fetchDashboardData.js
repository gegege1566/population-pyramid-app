require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 統計ダッシュボードAPI（正しいエンドポイント）
const BASE_URL = 'https://dashboard.e-stat.go.jp/api/1.0/Json';
const POPULATION_INDICATOR_CODE = '0201010000000010000'; // Excelから取得した人口ピラミッド系列ID

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

async function testDashboardApiConnection() {
  try {
    console.log('Testing Dashboard API connection...\n');
    
    // データ取得APIをテスト（正しいエンドポイント）
    const response = await axios.get(`${BASE_URL}/getData`, {
      params: {
        IndicatorCode: POPULATION_INDICATOR_CODE
      },
      timeout: 15000
    });
    
    console.log('✓ API Connection successful!');
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(response.data));
    
    if (response.data.GET_STATS) {
      console.log('Data structure:', Object.keys(response.data.GET_STATS));
      
      if (response.data.GET_STATS.STATISTICAL_DATA) {
        console.log('Statistical data available');
        console.log('Total records:', response.data.GET_STATS.STATISTICAL_DATA.RESULT_INF?.TOTAL_NUMBER);
        
        // サンプルデータを保存
        const samplePath = path.join(__dirname, 'dashboard_api_sample.json');
        await fs.writeFile(samplePath, JSON.stringify(response.data, null, 2));
        console.log(`Sample data saved to: ${samplePath}`);
        
        return response.data;
      }
    }
    
    return null;
    
  } catch (error) {
    console.log('✗ API Connection failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data?.substring(0, 200) || 'No response data');
    }
    return null;
  }
}

async function getPopulationDataByRegion(regionCode, year) {
  try {
    console.log(`Fetching data for region ${regionCode} (${year})...`);
    
    const response = await axios.get(`${BASE_URL}/getData`, {
      params: {
        IndicatorCode: POPULATION_INDICATOR_CODE,
        RegionCode: regionCode,
        StartPeriod: year,
        EndPeriod: year
      },
      timeout: 10000
    });
    
    if (response.data.GET_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
      const values = response.data.GET_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
      console.log(`Found ${values.length} data points`);
      return values;
    } else {
      console.log('No data found');
      return [];
    }
    
  } catch (error) {
    console.error(`Error fetching data for ${regionCode}: ${error.message}`);
    return [];
  }
}

async function getAllPrefecturePopulationData(year) {
  console.log(`\n=== Fetching population data for all prefectures (${year}) ===`);
  
  const allData = {};
  
  // 全国データを最初に取得
  try {
    console.log('Fetching national data...');
    const nationalData = await getPopulationDataByRegion('00000', year);
    if (nationalData.length > 0) {
      allData['00'] = nationalData; // 全国は00コード
      console.log('✓ National data retrieved');
    }
  } catch (error) {
    console.log('✗ National data failed:', error.message);
  }
  
  // 各都道府県のデータを取得
  for (const [prefCode, prefName] of Object.entries(PREFECTURE_CODES)) {
    try {
      const regionCode = prefCode + '000'; // 都道府県コード（01000, 13000など）
      const data = await getPopulationDataByRegion(regionCode, year);
      
      if (data.length > 0) {
        allData[prefCode] = parsePopulationData(data, year, prefCode, prefName);
        console.log(`✓ ${prefName}: ${data.length} records`);
      } else {
        console.log(`⚠ ${prefName}: No data`);
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`✗ ${prefName}: Error - ${error.message}`);
    }
  }
  
  return allData;
}

function parsePopulationData(apiData, year, prefCode, prefName) {
  const populationData = [];
  
  // APIデータを人口ピラミッド形式に変換
  apiData.forEach(item => {
    // データ構造を分析して適切にパース
    // 実際のAPIレスポンス構造に応じて調整が必要
    
    populationData.push({
      year: parseInt(year),
      prefecture: prefName,
      prefectureCode: prefCode,
      ageGroup: extractAgeGroup(item),
      gender: extractGender(item),
      population: parseInt(item.value || item['$'] || 0)
    });
  });
  
  return populationData;
}

function extractAgeGroup(item) {
  // APIレスポンスから年齢階級を抽出
  // 実際の構造に応じて実装
  return '0-4'; // プレースホルダー
}

function extractGender(item) {
  // APIレスポンスから性別を抽出
  // 実際の構造に応じて実装
  return 'male'; // プレースホルダー
}

async function main() {
  console.log('=== Dashboard API Population Data Fetcher ===\n');
  
  // API接続テスト
  const testResult = await testDashboardApiConnection();
  
  if (testResult) {
    console.log('\n✅ API connection successful');
    
    // 5年刻みのデータを取得
    const targetYears = [2020, 2015, 2010, 2005, 2000];
    const dataDir = path.join(__dirname, '..', 'public', 'data', 'population');
    await fs.mkdir(dataDir, { recursive: true });
    
    for (const year of targetYears) {
      try {
        const yearData = await getAllPrefecturePopulationData(year);
        
        if (Object.keys(yearData).length > 0) {
          const filePath = path.join(dataDir, `population_${year}.json`);
          await fs.writeFile(filePath, JSON.stringify(yearData, null, 2));
          console.log(`\n✅ Saved data for ${year}: ${Object.keys(yearData).length} regions`);
        } else {
          console.log(`\n⚠ No data available for ${year}`);
        }
        
      } catch (error) {
        console.log(`\n✗ Failed to fetch data for ${year}: ${error.message}`);
      }
    }
    
  } else {
    console.log('\n❌ API connection failed');
    console.log('Please check the API endpoint and indicator code');
  }
}

main();