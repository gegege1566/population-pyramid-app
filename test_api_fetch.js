#!/usr/bin/env node
const fetch = require('node-fetch');

// テスト用APIリクエスト
async function testApiFetch() {
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  const seriesId = '0201130120000010010'; // 男性0-4歳
  const regionCode = '10000'; // 群馬県
  
  const url = `${baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${regionCode}`;
  
  console.log('🔍 Testing API URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Status:', data.GET_STATS?.RESULT?.status);
      console.log('📋 Error Message:', data.GET_STATS?.RESULT?.errorMsg);
      
      const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
      if (dataObjects && Array.isArray(dataObjects)) {
        console.log('🎯 Data objects count:', dataObjects.length);
        console.log('📝 Sample data:', dataObjects[0]?.VALUE);
      } else {
        console.log('❌ No data objects found');
      }
    } else {
      console.error('❌ HTTP Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testApiFetch();