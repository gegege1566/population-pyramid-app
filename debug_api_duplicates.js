#!/usr/bin/env node
const fetch = require('node-fetch');

async function debugAPIDuplicates() {
  console.log('🔍 APIデータの重複問題を詳細調査...');
  
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  
  // 千葉県のテスト（重複が見つかった）
  const chibaCode = '12000';
  
  // 男性データの系列IDで重複をチェック
  const maleSeries = [
    "0201130120000010010", // 0-4歳
    "0201130120000010020", // 5-9歳
    "0201130120000010030", // 10-14歳
    "0201130120000010040", // 15-19歳
    "0201130120000010050", // 20-24歳
    "0201130120000010060", // 25-29歳
    "0201130120000010070", // 30-34歳
  ];
  
  const ageGroups = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34"];
  
  console.log('\n📊 千葉県男性データの詳細取得...');
  
  const chibaData = [];
  
  for (let i = 0; i < maleSeries.length; i++) {
    const seriesId = maleSeries[i];
    const ageGroup = ageGroups[i];
    
    const url = `${baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${chibaCode}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status === "0") {
        const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
        
        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === 2025) {
            const rawValue = parseInt(value['$']);
            const processedValue = Math.round(rawValue / 1000);
            
            chibaData.push({
              ageGroup,
              rawValue,
              processedValue,
              timeCode
            });
            
            console.log(`  ${ageGroup}: ${rawValue} → ${processedValue}千人 (time: ${timeCode})`);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error fetching ${ageGroup}:`, error.message);
    }
  }
  
  // 重複チェック
  console.log('\n🔍 重複値の分析:');
  const valueMap = new Map();
  
  chibaData.forEach(d => {
    if (!valueMap.has(d.processedValue)) {
      valueMap.set(d.processedValue, []);
    }
    valueMap.get(d.processedValue).push(d);
  });
  
  const duplicates = Array.from(valueMap.entries()).filter(([value, records]) => records.length > 1);
  
  if (duplicates.length > 0) {
    duplicates.forEach(([value, records]) => {
      console.log(`  ❌ 重複値 ${value}千人:`);
      records.forEach(r => {
        console.log(`    ${r.ageGroup}: 元値${r.rawValue} (${r.timeCode})`);
      });
    });
  } else {
    console.log('  ✅ 重複なし');
  }
  
  // 群馬県との比較
  console.log('\n📊 群馬県との比較（正常例）...');
  const gunmaCode = '10000';
  
  const gunmaData = [];
  
  for (let i = 0; i < 3; i++) { // 最初の3つだけ
    const seriesId = maleSeries[i];
    const ageGroup = ageGroups[i];
    
    const url = `${baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${gunmaCode}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status === "0") {
        const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
        
        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === 2025) {
            const rawValue = parseInt(value['$']);
            const processedValue = Math.round(rawValue / 1000);
            
            console.log(`  群馬 ${ageGroup}: ${rawValue} → ${processedValue}千人`);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error fetching Gunma ${ageGroup}:`, error.message);
    }
  }
  
  // API レスポンスの構造をより詳しく調査
  console.log('\n🔍 APIレスポンス構造の詳細調査...');
  
  const detailUrl = `${baseUrl}?Lang=JP&IndicatorCode=0201130120000010010&RegionCode=${chibaCode}`;
  
  try {
    const response = await fetch(detailUrl);
    const data = await response.json();
    
    console.log('📋 APIレスポンス構造:');
    console.log('  Status:', data.GET_STATS?.RESULT?.status);
    console.log('  Error Message:', data.GET_STATS?.RESULT?.errorMsg);
    
    const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
    console.log(`  Data Objects Count: ${dataObjects.length}`);
    
    if (dataObjects.length > 0) {
      console.log('  Sample Data Object:');
      const sample = dataObjects[0];
      console.log(`    VALUE.$: ${sample.VALUE['$']}`);
      console.log(`    VALUE.@time: ${sample.VALUE['@time']}`);
      console.log(`    VALUE.@indicator: ${sample.VALUE['@indicator']}`);
      
      // 他の年度も確認
      console.log('  All Time Codes:');
      dataObjects.forEach((obj, index) => {
        console.log(`    [${index}] ${obj.VALUE['@time']}: ${obj.VALUE['$']}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Detail fetch error:', error.message);
  }
}

debugAPIDuplicates().catch(console.error);