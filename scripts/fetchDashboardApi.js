require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 新しいAPIエンドポイント
const BASE_URL = 'https://dashboard.e-stat.go.jp/static/api';
const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

// 抽出したデータID
const POPULATION_PYRAMID_SERIES_ID = '0201010000000010000';

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

async function testDashboardApi() {
  try {
    console.log('Testing Dashboard API endpoint...\n');
    
    // まずAPIの構造を確認
    const testUrls = [
      `${BASE_URL}/series/${POPULATION_PYRAMID_SERIES_ID}`,
      `${BASE_URL}/data/${POPULATION_PYRAMID_SERIES_ID}`,
      `${BASE_URL}/population/pyramid`,
      `${BASE_URL}/timeseries/${POPULATION_PYRAMID_SERIES_ID}`
    ];
    
    for (const url of testUrls) {
      console.log(`Testing: ${url}`);
      try {
        const response = await axios.get(url, {
          params: {
            appId: API_KEY
          },
          timeout: 10000
        });
        
        console.log('✓ Success!');
        console.log('Status:', response.status);
        console.log('Data type:', typeof response.data);
        
        if (typeof response.data === 'object') {
          console.log('Keys:', Object.keys(response.data));
          if (Array.isArray(response.data)) {
            console.log('Array length:', response.data.length);
            if (response.data.length > 0) {
              console.log('First item:', response.data[0]);
            }
          }
        } else {
          console.log('Data preview:', response.data.substring(0, 200));
        }
        console.log();
        
        // 成功した場合は詳細を保存
        const outputPath = path.join(__dirname, `dashboard_api_response_${Date.now()}.json`);
        await fs.writeFile(outputPath, JSON.stringify(response.data, null, 2));
        console.log(`Response saved to: ${outputPath}\n`);
        
        break; // 成功したら他のURLはスキップ
        
      } catch (error) {
        console.log('✗ Failed:', error.message);
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Response:', error.response.data);
        }
        console.log();
      }
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

async function fetchPopulationPyramidData() {
  try {
    console.log('Fetching population pyramid data from Dashboard API...\n');
    
    // 様々なエンドポイント形式を試す
    const endpoints = [
      '/series',
      '/data',
      '/timeseries', 
      '/statistics'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`Trying endpoint: ${endpoint}`);
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          params: {
            seriesId: POPULATION_PYRAMID_SERIES_ID,
            appId: API_KEY
          }
        });
        
        console.log('✓ Success with', endpoint);
        return response.data;
        
      } catch (error) {
        console.log('✗ Failed with', endpoint, ':', error.message);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== Dashboard API Integration ===\n');
  console.log('Series ID:', POPULATION_PYRAMID_SERIES_ID);
  console.log('Base URL:', BASE_URL);
  console.log();
  
  // APIテスト
  await testDashboardApi();
  
  // データ取得テスト
  const data = await fetchPopulationPyramidData();
  
  if (data) {
    console.log('✅ Successfully fetched data from Dashboard API');
  } else {
    console.log('❌ Failed to fetch data from Dashboard API');
    console.log('Note: This API might require different authentication or endpoints');
  }
}

main();