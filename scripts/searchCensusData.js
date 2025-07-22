require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function searchCensusData() {
  try {
    console.log('Searching for census data with 5-year intervals...\n');
    
    // 国勢調査データを検索
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList', {
      params: {
        appId: API_KEY,
        searchWord: '国勢調査 年齢',
        statsNameList: 'Y' // 統計調査名による検索
      }
    });

    const tables = response.data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
    
    console.log(`Found ${tables.length} tables\n`);
    
    // 5年刻みのデータが含まれる可能性のあるテーブル
    const targetYears = ['2020', '2015', '2010', '2005', '2000', '1995', '1990'];
    const relevantTables = [];
    
    tables.forEach(table => {
      const surveyDate = table.SURVEY_DATE;
      const title = table.TITLE['$'];
      
      // 年度と都道府県別データを含むテーブルを探す
      targetYears.forEach(year => {
        if (surveyDate && surveyDate.toString().startsWith(year) && 
            title.includes('都道府県') && 
            (title.includes('年齢') || title.includes('歳')) &&
            !title.includes('外国人') &&
            !title.includes('配偶関係')) {
          relevantTables.push({
            id: table['@id'],
            title: title,
            year: year,
            survey: surveyDate,
            updated: table.UPDATED_DATE
          });
        }
      });
    });

    console.log('Census tables with 5-year intervals:\n');
    
    // 年度でグループ化して表示
    targetYears.forEach(year => {
      const yearTables = relevantTables.filter(t => t.year === year);
      if (yearTables.length > 0) {
        console.log(`\n=== ${year}年国勢調査 ===`);
        yearTables.slice(0, 3).forEach(table => {
          console.log(`ID: ${table.id}`);
          console.log(`Title: ${table.title}`);
          console.log(`Updated: ${table.updated}`);
          console.log('---');
        });
      }
    });

    // 最新のものをテスト
    if (relevantTables.length > 0) {
      const testTable = relevantTables[0];
      console.log(`\nTesting table ${testTable.id}...`);
      
      const testResponse = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
        params: {
          appId: API_KEY,
          statsDataId: testTable.id,
          limit: 10
        }
      });
      
      if (testResponse.data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
        console.log('✓ Data available');
        
        // メタ情報も確認
        const metaResponse = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
          params: {
            appId: API_KEY,
            statsDataId: testTable.id
          }
        });
        
        const areaObj = metaResponse.data.GET_META_INFO?.CLASS_INF?.CLASS_OBJ?.find(obj => obj['@id'] === 'area');
        if (areaObj) {
          console.log('\nSample area codes:');
          const areas = Array.isArray(areaObj.CLASS) ? areaObj.CLASS.slice(0, 5) : [areaObj.CLASS];
          areas.forEach(area => {
            if (area['@name'].includes('県') || area['@name'].includes('都') || area['@name'].includes('府') || area['@name'].includes('道')) {
              console.log(`  ${area['@name']} (Code: ${area['@code']})`);
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchCensusData();