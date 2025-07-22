require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function testSimpleApi() {
  try {
    // 東京都の最新データを取得
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData`;
    
    const params = {
      appId: API_KEY,
      statsDataId: '0003448237',
      cdArea: '13000',
      limit: 100
    };
    
    console.log('Testing API with params:', params);
    
    const response = await axios.get(url, { params });
    
    // データの一部を表示
    const values = response.data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    if (values && values.length > 0) {
      console.log('\nSample data:');
      values.slice(0, 5).forEach(v => {
        console.log(`Time: ${v['@time']}, Area: ${v['@area']}, Cat01: ${v['@cat01']}, Cat02: ${v['@cat02']}, Value: ${v['$']}`);
      });
      
      // 時間コードのパターンを分析
      const timeCodes = [...new Set(values.map(v => v['@time']))];
      console.log('\nAvailable time codes:', timeCodes.slice(0, 10));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleApi();