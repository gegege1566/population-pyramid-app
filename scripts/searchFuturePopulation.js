require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function searchFuturePopulation() {
  try {
    console.log('Searching for future population projection tables...\n');
    
    // 将来推計人口のテーブルを検索
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList', {
      params: {
        appId: API_KEY,
        searchWord: '将来推計人口',
        statsCode: '00200524,00450011' // 人口推計と将来推計人口
      }
    });

    const tables = response.data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
    
    console.log(`Found ${tables.length} tables\n`);
    
    // 都道府県別・年齢階級別のテーブルを探す
    const relevantTables = tables.filter(table => {
      const title = table.TITLE['$'];
      return (title.includes('都道府県') || title.includes('道府県')) && 
             (title.includes('年齢') || title.includes('歳階級')) &&
             !title.includes('市区町村');
    });

    console.log('Relevant tables for prefecture-level age-specific projections:\n');
    
    relevantTables.forEach(table => {
      console.log(`ID: ${table['@id']}`);
      console.log(`Title: ${table.TITLE['$']}`);
      console.log(`Survey: ${table.SURVEY_DATE || 'N/A'}`);
      console.log(`Updated: ${table.UPDATED_DATE}`);
      console.log('---');
    });

    // 最も有望なテーブルのメタ情報を取得
    if (relevantTables.length > 0) {
      const tableId = relevantTables[0]['@id'];
      console.log(`\nChecking meta info for table ${tableId}...\n`);
      
      const metaResponse = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
        params: {
          appId: API_KEY,
          statsDataId: tableId
        }
      });

      const timeObj = metaResponse.data.GET_META_INFO?.CLASS_INF?.CLASS_OBJ?.find(obj => obj['@id'] === 'time');
      
      if (timeObj && timeObj.CLASS) {
        const timeCodes = Array.isArray(timeObj.CLASS) ? timeObj.CLASS : [timeObj.CLASS];
        console.log('Available years in this table:');
        
        const fiveYearIntervals = timeCodes.filter(time => {
          const name = time['@name'];
          return name.match(/20[2-5][05]年/);
        });
        
        fiveYearIntervals.forEach(time => {
          console.log(`  ${time['@name']} (Code: ${time['@code']})`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchFuturePopulation();