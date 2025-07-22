const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

async function testHistoricalStructure() {
  // Test the 2015 census table we found
  const historicalTables = [
    '0003160018', // 2015年: 現住都道府県，5年前の常住都道府県，年齢(5歳階級)，男女別人口
    '0003030412', // 2010年: 年齢（５歳階級）、男女別他都道府県からの転入者数
    '0000032220', // 1995年: 男女（３），年齢（５），人口・人口構成比 都道府県
    '0000032219'  // 1995年: 年齢各歳階級（１２３），男女（３），人口
  ];

  for (const tableId of historicalTables) {
    try {
      console.log(`\n=== ${tableId} の詳細調査 ===`);
      
      // Get metadata first
      const metaResponse = await axios.get(`${BASE_URL}/json/getMetaInfo`, {
        params: {
          appId: API_KEY,
          statsDataId: tableId,
          explanationGetFlg: 'Y'
        },
        timeout: 20000
      });

      const result = metaResponse.data?.GET_META_INFO?.RESULT;
      if (result?.STATUS !== 0) {
        console.log(`  エラー: ${result?.ERROR_MSG || 'メタデータ取得失敗'}`);
        continue;
      }

      const paramInfo = metaResponse.data?.GET_META_INFO?.PARAMETER_INF?.PARAMETER || [];
      
      console.log('パラメータ情報:');
      
      let hasGender = false;
      let hasAge = false;
      let hasArea = false;
      let hasTime = false;
      
      paramInfo.forEach((param, index) => {
        console.log(`  ${param['@code']}: ${param['@name']}`);
        
        if (param['@name'].includes('男女') || param['@name'].includes('性別')) {
          hasGender = true;
          console.log('    → 性別データあり');
        }
        
        if (param['@name'].includes('年齢') || param['@name'].includes('Age')) {
          hasAge = true;
          const classes = param.CLASS || [];
          if (Array.isArray(classes)) {
            console.log(`    → 年齢区分: ${classes.length}種類`);
            classes.slice(0, 3).forEach(cls => {
              console.log(`      ${cls['@code']}: ${cls['@name']}`);
            });
          }
        }
        
        if (param['@name'].includes('都道府県') || param['@name'].includes('地域')) {
          hasArea = true;
          console.log('    → 都道府県データあり');
        }
        
        if (param['@name'].includes('時間') || param['@name'].includes('年') || param['@code'].includes('time')) {
          hasTime = true;
          const classes = param.CLASS || [];
          if (Array.isArray(classes)) {
            console.log(`    → 時間軸: ${classes.length}種類`);
            classes.slice(0, 5).forEach(cls => {
              console.log(`      ${cls['@code']}: ${cls['@name']}`);
            });
          }
        }
      });

      console.log(`\n適用性評価:`);
      console.log(`  性別データ: ${hasGender ? '○' : '×'}`);
      console.log(`  年齢データ: ${hasAge ? '○' : '×'}`);
      console.log(`  都道府県データ: ${hasArea ? '○' : '×'}`);
      console.log(`  時間軸データ: ${hasTime ? '○' : '×'}`);
      
      if (hasGender && hasAge && hasArea) {
        console.log('  → このテーブルは人口ピラミッドに使用可能');
        
        // Try to get a small sample of actual data
        try {
          console.log('\n  サンプルデータ取得中...');
          const dataResponse = await axios.get(`${BASE_URL}/json/getStatsData`, {
            params: {
              appId: API_KEY,
              statsDataId: tableId,
              metaGetFlg: 'Y',
              cntGetFlg: 'N',
              limit: 10
            },
            timeout: 20000
          });

          const dataResult = dataResponse.data?.GET_STATS_DATA?.RESULT;
          if (dataResult?.STATUS === 0) {
            const values = dataResponse.data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
            console.log(`  → データ取得成功: ${values.length}件のサンプル`);
            
            if (values.length > 0) {
              console.log('    サンプル構造:');
              Object.keys(values[0]).forEach(key => {
                console.log(`      ${key}: ${values[0][key]}`);
              });
            }
          } else {
            console.log(`  → データ取得エラー: ${dataResult?.ERROR_MSG}`);
          }
        } catch (dataError) {
          console.log('  → データ取得でエラー');
        }
      }

    } catch (error) {
      console.log(`${tableId}: アクセスエラー - ${error.message}`);
    }
    
    // レート制限回避
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Also check for more recent historical data patterns
  console.log('\n=== 年代別検索 ===');
  
  const searchYears = ['2015', '2010', '2005', '2000'];
  
  for (const year of searchYears) {
    try {
      console.log(`\n--- ${year}年度の人口統計表 ---`);
      
      const response = await axios.get(`${BASE_URL}/json/getStatsList`, {
        params: {
          appId: API_KEY,
          searchWord: '年齢 男女 都道府県 人口',
          surveyYears: year,
          statsField: '00200521',
          limit: 5
        },
        timeout: 20000
      });

      const tables = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
      
      if (Array.isArray(tables) && tables.length > 0) {
        tables.forEach((table, index) => {
          const title = table.TITLE['$'] || table.TITLE;
          if (title.includes('年齢') && title.includes('都道府県')) {
            console.log(`  候補: ${table['@id']} - ${title}`);
          }
        });
      } else {
        console.log(`  ${year}年: 該当なし`);
      }
      
    } catch (error) {
      console.log(`  ${year}年: 検索エラー`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testHistoricalStructure();