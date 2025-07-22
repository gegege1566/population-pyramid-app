require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://dashboard.e-stat.go.jp/api/1.0/Json';

// 将来推計データのID（男性・女性）
const FUTURE_PROJECTION_IDS = [
  // 男性データ (0201130120000010XXX030301)
  '0201130120000010000030301', // 0-4歳
  '0201130120000010010030301', // 5-9歳
  '0201130120000010020030301', // 10-14歳
  '0201130120000010030030301', // 15-19歳
  '0201130120000010040030301', // 20-24歳
  '0201130120000010050030301', // 25-29歳
  '0201130120000010060030301', // 30-34歳
  '0201130120000010070030301', // 35-39歳
  '0201130120000010080030301', // 40-44歳
  '0201130120000010090030301', // 45-49歳
  '0201130120000010100030301', // 50-54歳
  '0201130120000010110030301', // 55-59歳
  '0201130120000010120030301', // 60-64歳
  '0201130120000010130030301', // 65-69歳
  '0201130120000010140030301', // 70-74歳
  '0201130120000010150030301', // 75-79歳
  '0201130120000010160030301', // 80-84歳
  '0201130120000010170030301', // 85-89歳
  '0201130120000010180030301', // 90歳以上
  '0201130120000010200030301', // 不詳
  '0201130120000010205030301', // 総数
  
  // 女性データ (0201130220000010XXX030301)
  '0201130220000010000030301', // 0-4歳
  '0201130220000010010030301', // 5-9歳
  '0201130220000010020030301', // 10-14歳
  '0201130220000010030030301', // 15-19歳
  '0201130220000010040030301', // 20-24歳
  '0201130220000010050030301', // 25-29歳
  '0201130220000010060030301', // 30-34歳
  '0201130220000010070030301', // 35-39歳
  '0201130220000010080030301', // 40-44歳
  '0201130220000010090030301', // 45-49歳
  '0201130220000010100030301', // 50-54歳
  '0201130220000010110030301', // 55-59歳
  '0201130220000010120030301', // 60-64歳
  '0201130220000010130030301', // 65-69歳
  '0201130220000010140030301', // 70-74歳
  '0201130220000010150030301', // 75-79歳
  '0201130220000010160030301', // 80-84歳
  '0201130220000010170030301', // 85-89歳
  '0201130220000010180030301', // 90歳以上
  '0201130220000010200030301', // 不詳
  '0201130220000010205030301'  // 総数
];

// 年齢グループマッピング
const AGE_GROUP_MAPPING = {
  '10000': '0-4',
  '10010': '5-9', 
  '10020': '10-14',
  '10030': '15-19',
  '10040': '20-24',
  '10050': '25-29',
  '10060': '30-34',
  '10070': '35-39',
  '10080': '40-44',
  '10090': '45-49',
  '10100': '50-54',
  '10110': '55-59',
  '10120': '60-64',
  '10130': '65-69',
  '10140': '70-74',
  '10150': '75-79',
  '10160': '80-84',
  '10170': '85+', // 85-89歳を85+として統合
  '10180': '85+', // 90歳以上も85+として統合
  '10200': 'unknown',
  '10205': 'total'
};

async function testFutureProjectionApi() {
  console.log('=== Testing Future Projection Data API ===\n');
  
  // 複数のエンドポイントを試す
  const testId = FUTURE_PROJECTION_IDS[0];
  console.log(`Testing with ID: ${testId}`);
  
  const endpoints = [
    `${BASE_URL}/getData`,
    `${BASE_URL}/getStatisticalData`,
    `${BASE_URL}/getSeries`,
    'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Trying endpoint: ${endpoint}`);
    
    try {
      const params = endpoint.includes('e-stat.go.jp') 
        ? {
            appId: process.env.REACT_APP_ESTAT_API_KEY || 'test',
            statsDataId: testId,
            limit: 10
          }
        : {
            IndicatorCode: testId,
            limit: 100
          };
      
      const response = await axios.get(endpoint, {
        params,
        timeout: 15000
      });
      
      console.log(`✓ Success with ${endpoint}!`);
      console.log('Response structure:', Object.keys(response.data));
      
      // レスポンス内容を確認
      if (response.data.GET_STATS?.STATISTICAL_DATA || response.data.GET_STATS_DATA) {
        const data = response.data.GET_STATS?.STATISTICAL_DATA || response.data.GET_STATS_DATA?.STATISTICAL_DATA;
        console.log('Total records:', data?.RESULT_INF?.TOTAL_NUMBER);
        
        // サンプルデータを表示
        if (data?.DATA_INF?.DATA_OBJ || data?.DATA?.VALUE) {
          const samples = data?.DATA_INF?.DATA_OBJ 
            ? (Array.isArray(data.DATA_INF.DATA_OBJ) ? data.DATA_INF.DATA_OBJ.slice(0, 3) : [data.DATA_INF.DATA_OBJ])
            : (Array.isArray(data.DATA.VALUE) ? data.DATA.VALUE.slice(0, 3) : [data.DATA.VALUE]);
          
          console.log('\nSample data:');
          samples.forEach((obj, i) => {
            const value = obj.VALUE || obj;
            console.log(`${i + 1}. Region: ${value['@area'] || value['@regionCode']}, Time: ${value['@time']}, Value: ${value['$']}`);
          });
        }
        
        return { endpoint, data: response.data };
      }
      
    } catch (error) {
      console.log(`✗ Failed with ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('❌ All endpoints failed');
  return null;
}

async function fetchProjectionDataForYear(year) {
  console.log(`\n=== Fetching Future Projection Data for ${year} ===`);
  
  const timeCode = `${year}CY00`; // 例: 2030CY00
  const allData = {};
  
  for (let i = 0; i < FUTURE_PROJECTION_IDS.length; i++) {
    const indicatorId = FUTURE_PROJECTION_IDS[i];
    
    try {
      console.log(`Fetching ${i + 1}/${FUTURE_PROJECTION_IDS.length}: ${indicatorId.slice(-15)}`);
      
      const response = await axios.get(`${BASE_URL}/getData`, {
        params: {
          IndicatorCode: indicatorId,
          time: timeCode, // 特定年のデータのみ
          regionCode: '13000', // 東京都
          limit: 50
        },
        timeout: 10000
      });
      
      if (response.data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ) {
        const dataObjects = Array.isArray(response.data.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ) 
          ? response.data.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ 
          : [response.data.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ];
        
        // データを解析して構造化
        dataObjects.forEach(obj => {
          const value = obj.VALUE;
          const population = parseInt(value['$']);
          
          // 年齢グループとジェンダーを判定
          const ageCode = indicatorId.slice(15, 20); // 例: 10000
          const genderCode = indicatorId.slice(7, 8); // 1=男性, 2=女性
          
          const ageGroup = AGE_GROUP_MAPPING[ageCode];
          const gender = genderCode === '1' ? 'male' : 'female';
          
          if (ageGroup && ageGroup !== 'unknown' && ageGroup !== 'total') {
            const key = `${ageGroup}_${gender}`;
            allData[key] = population;
          }
        });
        
        console.log(`✓ Success: ${dataObjects.length} records`);
      } else {
        console.log('✗ No data returned');
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
  
  return allData;
}

function convertToAppFormat(rawData, year) {
  console.log('\n=== Converting to App Format ===');
  
  const ageGroups = [
    '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', 
    '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', 
    '65-69', '70-74', '75-79', '80-84', '85+'
  ];
  
  const formattedData = [];
  let totalPopulation = 0;
  
  ageGroups.forEach(ageGroup => {
    const maleKey = `${ageGroup}_male`;
    const femaleKey = `${ageGroup}_female`;
    
    const malePopulation = rawData[maleKey] || 0;
    const femalePopulation = rawData[femaleKey] || 0;
    
    if (malePopulation > 0) {
      formattedData.push({
        ageGroup,
        gender: 'male',
        population: malePopulation * 1000 // 千人単位から人単位に変換
      });
      totalPopulation += malePopulation * 1000;
    }
    
    if (femalePopulation > 0) {
      formattedData.push({
        ageGroup,
        gender: 'female',
        population: femalePopulation * 1000
      });
      totalPopulation += femalePopulation * 1000;
    }
  });
  
  return {
    prefecture: '東京都',
    prefectureCode: '13',
    year: year,
    totalPopulation: totalPopulation,
    data: formattedData
  };
}

async function main() {
  console.log('=== Future Projection Data Fetcher ===\n');
  
  // APIテスト
  const testResult = await testFutureProjectionApi();
  
  if (!testResult) {
    console.log('❌ API test failed. Cannot proceed with data fetching.');
    return;
  }
  
  console.log('✅ API test successful. Proceeding with data fetching...');
  
  // 将来年度のデータを取得
  const targetYears = [2025, 2030, 2035, 2040, 2045, 2050];
  const dataDir = path.join(__dirname, '..', 'public', 'data', 'population');
  await fs.mkdir(dataDir, { recursive: true });
  
  for (const year of targetYears) {
    try {
      console.log(`\n🔄 Processing year ${year}...`);
      
      const rawData = await fetchProjectionDataForYear(year);
      
      if (Object.keys(rawData).length > 0) {
        const formattedData = convertToAppFormat(rawData, year);
        
        const outputData = {
          '13': formattedData
        };
        
        const filePath = path.join(dataDir, `population_${year}.json`);
        await fs.writeFile(filePath, JSON.stringify(outputData, null, 2));
        
        console.log(`✅ Saved projection data for ${year}: ${formattedData.data.length} age groups`);
        console.log(`   Total population: ${formattedData.totalPopulation.toLocaleString()}`);
      } else {
        console.log(`⚠️ No data retrieved for ${year}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to process ${year}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Future projection data fetching completed!');
}

main();