require('dotenv').config();
const axios = require('axios');

async function testCorrectEndpoints() {
  console.log('Testing various Dashboard API endpoints...\n');
  
  const possibleEndpoints = [
    'https://dashboard.e-stat.go.jp/api/1.0/Json/getData',
    'https://dashboard.e-stat.go.jp/api/1.0/Json/getSeries',
    'https://dashboard.e-stat.go.jp/api/1.0/Json/getStatisticalData',
    'https://dashboard.e-stat.go.jp/api/getData',
    'https://dashboard.e-stat.go.jp/api/getSeries',
    'https://dashboard.e-stat.go.jp/api/json/getData',
    'https://dashboard.e-stat.go.jp/rest/1.0/app/json/getData'
  ];
  
  const testParams = [
    { IndicatorCode: '0201010000000010000' },
    { seriesCode: '0201010000000010000' },
    { id: '0201010000000010000' },
    { series: '0201010000000010000' }
  ];
  
  for (const endpoint of possibleEndpoints) {
    console.log(`Testing: ${endpoint}`);
    
    for (const params of testParams) {
      try {
        const response = await axios.get(endpoint, {
          params: params,
          timeout: 8000
        });
        
        console.log('✓ SUCCESS!');
        console.log('Params:', params);
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Response keys:', Object.keys(response.data));
        
        // レスポンス内容の概要
        if (typeof response.data === 'object') {
          console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));
        }
        console.log('\n=== FOUND WORKING ENDPOINT ===\n');
        return { endpoint, params, data: response.data };
        
      } catch (error) {
        if (error.code !== 'ENOTFOUND' && error.response?.status !== 404) {
          console.log(`  Status: ${error.response?.status || 'Unknown'}`);
          if (error.response?.data && typeof error.response.data === 'string') {
            console.log(`  Response: ${error.response.data.substring(0, 100)}...`);
          }
        }
      }
    }
    console.log('  ✗ Failed\n');
  }
  
  console.log('No working endpoints found with the given indicator code.');
  console.log('The API might require different parameters or authentication.');
  
  return null;
}

// シリーズ情報を取得するAPIもテスト
async function testSeriesApi() {
  console.log('Testing Series API for metadata...\n');
  
  const seriesEndpoints = [
    'https://dashboard.e-stat.go.jp/api/1.0/Json/getSeries',
    'https://dashboard.e-stat.go.jp/api/getSeries',
    'https://dashboard.e-stat.go.jp/api/series'
  ];
  
  for (const endpoint of seriesEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(endpoint, {
        params: { limit: 5 },
        timeout: 8000
      });
      
      console.log('✓ Series API Success!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 400));
      return response.data;
      
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }
  
  return null;
}

async function main() {
  const result = await testCorrectEndpoints();
  
  if (!result) {
    console.log('\nTrying to get series metadata...');
    const seriesResult = await testSeriesApi();
    
    if (!seriesResult) {
      console.log('\n❌ Unable to connect to Dashboard API');
      console.log('The API might be restricted or require different access methods');
    }
  }
}

main();