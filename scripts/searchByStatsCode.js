require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function searchByStatsCode() {
  try {
    console.log('Searching population statistics by stats code...\n');
    
    // 統計コードで検索（国勢調査と人口推計）
    const statsCodes = [
      { code: '00200521', name: '国勢調査' },
      { code: '00200524', name: '人口推計' },
      { code: '00200531', name: '住民基本台帳' },
      { code: '00450011', name: '将来推計人口' }
    ];
    
    for (const stats of statsCodes) {
      console.log(`\n=== ${stats.name} (${stats.code}) ===`);
      
      try {
        const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList', {
          params: {
            appId: API_KEY,
            statsCode: stats.code,
            limit: 100
          }
        });

        const tables = response.data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        
        if (Array.isArray(tables)) {
          // 都道府県別・年齢階級別のテーブルを探す
          const relevantTables = tables.filter(table => {
            const title = table.TITLE['$'];
            return title.includes('都道府県') && 
                   (title.includes('年齢') || title.includes('歳階級')) &&
                   !title.includes('市区町村');
          });
          
          console.log(`Found ${relevantTables.length} relevant tables`);
          
          relevantTables.slice(0, 5).forEach(table => {
            console.log(`\nID: ${table['@id']}`);
            console.log(`Title: ${table.TITLE['$']}`);
            console.log(`Survey: ${table.SURVEY_DATE || 'N/A'}`);
          });
        }
      } catch (err) {
        console.log(`Error searching ${stats.name}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchByStatsCode();