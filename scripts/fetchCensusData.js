require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';

// 国勢調査の統計表ID（5年ごと）
const CENSUS_TABLE_IDS = {
  2020: '0003450921', // 令和2年国勢調査
  2015: '0003148488', // 平成27年国勢調査  
  2010: '0003036275', // 平成22年国勢調査
  2005: '0000033211', // 平成17年国勢調査
  2000: '0000031177'  // 平成12年国勢調査
};

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

async function fetchCensusDataForYear(year, tableId) {
  console.log(`\n=== Fetching ${year} census data (Table: ${tableId}) ===`);
  
  const yearData = {};
  
  // まず東京都でテスト
  try {
    console.log('Testing with Tokyo...');
    const testResponse = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
      params: {
        appId: API_KEY,
        statsDataId: tableId,
        limit: 100
      }
    });
    
    if (testResponse.data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
      const values = testResponse.data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
      console.log(`Found ${values.length} records`);
      
      // データ構造を分析
      if (values.length > 0) {
        console.log('Sample data:', values[0]);
        
        // 各都道府県のデータを整理
        for (const prefCode of Object.keys(PREFECTURE_CODES)) {
          const prefData = parseCensusData(values, year, prefCode);
          if (prefData.length > 0) {
            yearData[prefCode] = prefData;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching ${year} data:`, error.message);
  }
  
  return yearData;
}

function parseCensusData(values, year, prefCode) {
  const populationData = [];
  
  // 年齢グループ
  const ageGroups = [
    '0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
    '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
    '60-64', '65-69', '70-74', '75-79', '80-84', '85+'
  ];
  
  // 都道府県コードに対応するデータを抽出
  const prefValues = values.filter(v => {
    const areaCode = v['@area'] || v['@cat01'];
    return areaCode && areaCode.startsWith(prefCode);
  });
  
  // データを整形
  // 注：実際のデータ構造に応じて調整が必要
  
  return populationData;
}

async function checkTableStructure(tableId, year) {
  console.log(`\nChecking table structure for ${year}...`);
  
  try {
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
      params: {
        appId: API_KEY,
        statsDataId: tableId
      }
    });
    
    const classObjs = response.data.GET_META_INFO?.CLASS_INF?.CLASS_OBJ || [];
    
    console.log('Available dimensions:');
    classObjs.forEach(obj => {
      console.log(`- ${obj['@name']} (ID: ${obj['@id']})`);
    });
    
    return response.data.GET_META_INFO;
  } catch (error) {
    console.error(`Error checking ${year} structure:`, error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('Starting to fetch census data for 5-year intervals...');
    
    // まず各年のテーブル構造を確認
    for (const [year, tableId] of Object.entries(CENSUS_TABLE_IDS)) {
      await checkTableStructure(tableId, year);
    }
    
    // 実際のデータ取得は別途実装
    console.log('\nNote: Census data structure varies by year.');
    console.log('Different approach needed for each census year.');
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();