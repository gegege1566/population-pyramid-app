require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://dashboard.e-stat.go.jp/api/1.0/Json';
const POPULATION_INDICATOR_CODE = '0201010000000010000';

// 以前のテストで成功した接続を使用
const KNOWN_WORKING_ENDPOINT = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';

async function analyzeApiStructure() {
  try {
    console.log('=== Analyzing Dashboard API Data Structure ===\n');
    
    // 既存のサンプルデータを使用してAPIデータ構造を分析
    console.log('Using existing API sample data for analysis...\n');
    const sampleDataPath = path.join(__dirname, 'dashboard_api_sample.json');
    const sampleData = JSON.parse(await fs.readFile(sampleDataPath, 'utf8'));
    
    const data = sampleData.GET_STATS.STATISTICAL_DATA;
    console.log('Total available records:', data.RESULT_INF.TOTAL_NUMBER);
    
    if (data.DATA_INF?.DATA_OBJ) {
      const dataObjects = Array.isArray(data.DATA_INF.DATA_OBJ) 
        ? data.DATA_INF.DATA_OBJ 
        : [data.DATA_INF.DATA_OBJ];
      
      console.log(`Analyzing ${dataObjects.length} data objects...\n`);
      
      // ユニークな値を収集
      const uniqueRegions = new Set();
      const uniqueTimes = new Set();
      const uniqueStats = new Set();
      const regionTimeMap = new Map();
      
      dataObjects.forEach(obj => {
        if (obj.VALUE) {
          const value = obj.VALUE;
          const regionCode = value['@regionCode'];
          const time = value['@time'];
          const stat = value['@stat'];
          
          uniqueRegions.add(regionCode);
          uniqueTimes.add(time);
          uniqueStats.add(stat);
          
          // 地域と時間の組み合わせを記録
          const key = `${regionCode}-${time}`;
          if (!regionTimeMap.has(key)) {
            regionTimeMap.set(key, []);
          }
          regionTimeMap.get(key).push({
            value: value['$'],
            stat: stat,
            unit: value['@unit']
          });
        }
      });
      
      console.log('=== Analysis Results ===\n');
      
      // 地域コード分析
      console.log(`Unique Region Codes (${uniqueRegions.size}):`);
      const sortedRegions = Array.from(uniqueRegions).sort();
      console.log(sortedRegions.slice(0, 20).join(', '));
      if (sortedRegions.length > 20) {
        console.log(`... and ${sortedRegions.length - 20} more`);
      }
      
      // 都道府県コードを特定
      const prefectureCodes = sortedRegions.filter(code => 
        code && code.length >= 2 && code !== '00000' && !code.includes('00')
      );
      console.log('\nPrefecture-like codes:', prefectureCodes.slice(0, 10));
      
      // 時間コード分析
      console.log(`\nUnique Time Codes (${uniqueTimes.size}):`);
      const sortedTimes = Array.from(uniqueTimes).sort();
      console.log(sortedTimes.slice(0, 20));
      if (sortedTimes.length > 20) {
        console.log(`... and ${sortedTimes.length - 20} more`);
      }
      
      // 5年刻みの年度を特定
      const fiveYearIntervals = sortedTimes.filter(time => {
        if (time && time.length >= 4) {
          const year = parseInt(time.substring(0, 4));
          return year >= 1950 && year <= 2030 && year % 5 === 0;
        }
        return false;
      });
      console.log('\n5-year interval time codes:', fiveYearIntervals);
      
      // 統計コード分析
      console.log(`\nUnique Stat Codes (${uniqueStats.size}):`);
      console.log(Array.from(uniqueStats));
      
      // サンプルデータ表示
      console.log('\n=== Sample Data Points ===');
      dataObjects.slice(0, 5).forEach((obj, index) => {
        const value = obj.VALUE;
        console.log(`${index + 1}. Region: ${value['@regionCode']}, Time: ${value['@time']}, Value: ${value['$']}, Stat: ${value['@stat']}`);
      });
      
      // 分析結果を保存
      const analysisResult = {
        totalRecords: data.RESULT_INF.TOTAL_NUMBER,
        uniqueRegions: sortedRegions,
        uniqueTimes: sortedTimes,
        uniqueStats: Array.from(uniqueStats),
        prefectureCodes: prefectureCodes,
        fiveYearIntervals: fiveYearIntervals,
        sampleData: dataObjects.slice(0, 10).map(obj => obj.VALUE)
      };
      
      const outputPath = path.join(__dirname, 'api_structure_analysis.json');
      await fs.writeFile(outputPath, JSON.stringify(analysisResult, null, 2));
      console.log(`\n📊 Analysis saved to: ${outputPath}`);
      
      return analysisResult;
    }
    
  } catch (error) {
    console.error('Error analyzing API structure:', error.message);
    return null;
  }
}

async function testSpecificFilters() {
  console.log('\n=== Testing Specific Filters ===\n');
  
  const testCases = [
    // 東京都（地域コード13000）の2020年データ
    { regionCode: '13000', timeCode: '20201000' },
    { regionCode: '01000', timeCode: '20201000' }, // 北海道
    { regionCode: '00000', timeCode: '20201000' }, // 全国
    
    // 異なる時間形式のテスト
    { regionCode: '13000', timeCode: '2020' },
    { regionCode: '13000', timeCode: '202010' },
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing Region: ${testCase.regionCode}, Time: ${testCase.timeCode}`);
      
      const response = await axios.get(`${BASE_URL}/getData`, {
        params: {
          IndicatorCode: POPULATION_INDICATOR_CODE,
          regionCode: testCase.regionCode,
          time: testCase.timeCode,
          limit: 10
        },
        timeout: 10000
      });
      
      const dataObjects = response.data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
      if (dataObjects) {
        const count = Array.isArray(dataObjects) ? dataObjects.length : 1;
        console.log(`✓ Success: ${count} records found`);
        
        if (dataObjects.length > 0) {
          const sample = Array.isArray(dataObjects) ? dataObjects[0].VALUE : dataObjects.VALUE;
          console.log(`  Sample: Value=${sample['$']}, Region=${sample['@regionCode']}, Time=${sample['@time']}`);
        }
      } else {
        console.log('✗ No data returned');
      }
      
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }
    
    console.log();
  }
}

async function main() {
  const analysis = await analyzeApiStructure();
  
  if (analysis) {
    await testSpecificFilters();
    
    console.log('\n=== Recommendations ===');
    console.log('1. Use regionCode parameter with codes like: 01000, 13000, etc.');
    console.log('2. Use time parameter with formats like: 20201000, 20151000, etc.');
    console.log('3. The API contains data from multiple years and regions');
    console.log('4. Filter by specific stat codes if needed to get population pyramid data');
  }
}

main();