require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function testDirectApi() {
  try {
    // 2020年の東京都データを取得
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${API_KEY}&statsDataId=0003448237&limit=10`;
    
    console.log('Testing direct API call...');
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
    console.log('\nResponse structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDirectApi();