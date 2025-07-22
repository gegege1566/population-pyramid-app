const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

async function discoverTables() {
  try {
    // Search for historical census tables
    const response = await axios.get(`${BASE_URL}/json/getStatsList`, {
      params: {
        appId: API_KEY,
        searchWord: '人口 年齢 都道府県',
        statsField: '00200521', // 国勢調査
        dataType: 'CSV', 
        limit: 100,
        startPosition: 1
      },
      timeout: 30000
    });

    console.log('=== 発見された統計表 ===');
    
    const tables = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
    
    if (Array.isArray(tables)) {
      tables.forEach((table, index) => {
        console.log(`\n${index + 1}. ${table['@id']}`);
        console.log(`   タイトル: ${table.TITLE['$']}`);
        console.log(`   調査年月: ${table.SURVEY_DATE}`);
        console.log(`   統計分野: ${table.STAT_NAME['$']}`);
        if (table.CYCLE) {
          console.log(`   周期: ${table.CYCLE}`);
        }
        console.log(`   更新日: ${table.UPDATED_DATE}`);
      });
    }

    // Try to get metadata for some promising tables
    console.log('\n=== 詳細メタデータ調査 ===');
    
    // Test some recent census table IDs that might have historical data
    const testTables = [
      '0003445097', // Population by Sex, Age (five-year groups)
      '0003445248', // Population composition ratio by age
      '0003445217', // Population by Sex, Age and Nationality
      '0003412049', // Another population table
      '0003446135'  // Population structure table
    ];

    for (const tableId of testTables) {
      try {
        console.log(`\n--- ${tableId} の調査 ---`);
        const metaResponse = await axios.get(`${BASE_URL}/json/getMetaInfo`, {
          params: {
            appId: API_KEY,
            statsDataId: tableId,
            explanationGetFlg: 'Y'
          },
          timeout: 20000
        });

        const metaData = metaResponse.data?.GET_META_INFO?.RESULT;
        if (metaData?.STATUS === 0) {
          const paramInfo = metaResponse.data?.GET_META_INFO?.PARAMETER_INF?.PARAMETER || [];
          
          paramInfo.forEach(param => {
            if (param['@code'] === 'cat04' || param['@name'].includes('時間軸')) {
              console.log(`時間軸データ:`);
              const timeValues = param.CLASS || [];
              if (Array.isArray(timeValues)) {
                timeValues.slice(0, 10).forEach(time => {
                  console.log(`  ${time['@code']}: ${time['@name']}`);
                });
                if (timeValues.length > 10) {
                  console.log(`  ... (${timeValues.length}件の時間データ)`);
                }
              }
            }
          });
        } else {
          console.log(`  エラー: ${metaData?.ERROR_MSG || 'データなし'}`);
        }
        
        // レート制限回避
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ${tableId}: アクセスエラー`);
      }
    }

  } catch (error) {
    console.error('Discovery Error:', error.message);
  }
}

discoverTables();