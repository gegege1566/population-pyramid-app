#!/usr/bin/env node
const fetch = require('node-fetch');

async function testApiEndpoints() {
  console.log('🔍 e-Stat API エンドポイントのテスト...');
  
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  
  // テストケース
  const testCases = [
    {
      name: '全国・男性・0-4歳',
      seriesId: '0201130120000010010',
      regionCode: '00000'
    },
    {
      name: '群馬県・男性・0-4歳', 
      seriesId: '0201130120000010010',
      regionCode: '10000'
    },
    {
      name: '東京都・男性・0-4歳',
      seriesId: '0201130120000010010', 
      regionCode: '13000'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📊 ${testCase.name} のテスト:`);
    
    const url = `${baseUrl}?Lang=JP&IndicatorCode=${testCase.seriesId}&RegionCode=${testCase.regionCode}`;
    console.log(`🔗 URL: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`📈 HTTP Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const status = data.GET_STATS?.RESULT?.status;
        const errorMsg = data.GET_STATS?.RESULT?.errorMsg;
        
        console.log(`🎯 API Status: ${status}`);
        if (errorMsg) {
          console.log(`❌ Error Message: ${errorMsg}`);
        }
        
        const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (dataObjects && Array.isArray(dataObjects)) {
          console.log(`✅ Data Objects: ${dataObjects.length} items`);
          if (dataObjects.length > 0) {
            const sample = dataObjects[0].VALUE;
            console.log(`📝 Sample: time=${sample['@time']}, value=${sample['$']}`);
          }
        } else {
          console.log(`❌ No data objects found`);
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`💥 Request failed: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🔍 新しいAPIエンドポイントのテスト...');
  
  // 別のAPIエンドポイントもテスト
  const alternativeUrls = [
    'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData',
    'https://api.e-stat.go.jp/rest/3.0/app/getStatsData'
  ];
  
  for (const altBaseUrl of alternativeUrls) {
    console.log(`\n🔗 Testing: ${altBaseUrl}`);
    
    const params = new URLSearchParams({
      appId: '6d35a9b04fe1ad86ad68b1552b00bb9c79b7c3b3',
      statsDataId: '0002010201',
      cdArea: '00000',
      cdTime: '2025'
    });
    
    const url = `${altBaseUrl}?${params}`;
    
    try {
      const response = await fetch(url);
      console.log(`📈 HTTP Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`📝 Response preview: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error(`💥 Request failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testApiEndpoints().catch(console.error);