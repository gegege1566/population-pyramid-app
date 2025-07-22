const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

async function testKnownTables() {
  // Test different search approaches
  console.log('=== 国勢調査関連の統計表検索 ===');
  
  try {
    // More general search for population census data
    const searchParams = [
      { searchWord: '人口', statsField: '00200521' },
      { searchWord: '年齢別人口', statsField: '00200521' },
      { searchWord: '都道府県別人口', statsField: '00200521' },
      { searchWord: '国勢調査', statsField: '' }
    ];

    for (const params of searchParams) {
      console.log(`\n--- 検索: ${params.searchWord} ---`);
      
      try {
        const response = await axios.get(`${BASE_URL}/json/getStatsList`, {
          params: {
            appId: API_KEY,
            ...params,
            limit: 20,
            startPosition: 1
          },
          timeout: 20000
        });

        const tables = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        
        if (Array.isArray(tables) && tables.length > 0) {
          tables.slice(0, 5).forEach((table, index) => {
            console.log(`${index + 1}. ${table['@id']}`);
            console.log(`   ${table.TITLE['$']}`);
            console.log(`   調査年: ${table.SURVEY_DATE}`);
          });
        } else {
          console.log('  該当なし');
        }
        
      } catch (error) {
        console.log(`  検索エラー: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test our current working table to understand its time structure better
    console.log('\n=== 現在の表 0003448237 の詳細調査 ===');
    
    try {
      const metaResponse = await axios.get(`${BASE_URL}/json/getMetaInfo`, {
        params: {
          appId: API_KEY,
          statsDataId: '0003448237',
          explanationGetFlg: 'Y'
        },
        timeout: 20000
      });

      const paramInfo = metaResponse.data?.GET_META_INFO?.PARAMETER_INF?.PARAMETER || [];
      
      paramInfo.forEach(param => {
        console.log(`\nパラメータ: ${param['@name']} (${param['@code']})`);
        
        const classes = param.CLASS || [];
        if (Array.isArray(classes)) {
          console.log(`  選択肢数: ${classes.length}`);
          classes.slice(0, 5).forEach(cls => {
            console.log(`    ${cls['@code']}: ${cls['@name']}`);
          });
          if (classes.length > 5) {
            console.log(`    ... その他 ${classes.length - 5} 項目`);
          }
        }
      });

    } catch (error) {
      console.log(`メタデータ取得エラー: ${error.message}`);
    }

    // Test if we can find older versions of similar data
    console.log('\n=== 古い年度データの検索 ===');
    
    // Try to search by older survey dates
    const oldYears = ['2015', '2010', '2005', '2000', '1995'];
    
    for (const year of oldYears) {
      try {
        console.log(`\n--- ${year}年調査データ ---`);
        
        const response = await axios.get(`${BASE_URL}/json/getStatsList`, {
          params: {
            appId: API_KEY,
            searchWord: '人口 年齢 都道府県',
            surveyYears: year,
            limit: 10
          },
          timeout: 20000
        });

        const tables = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        
        if (Array.isArray(tables) && tables.length > 0) {
          tables.slice(0, 3).forEach((table, index) => {
            console.log(`  ${table['@id']}: ${table.TITLE['$']}`);
          });
        } else {
          console.log(`  ${year}年: データなし`);
        }
        
      } catch (error) {
        console.log(`  ${year}年: 検索エラー`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('テストエラー:', error.message);
  }
}

testKnownTables();