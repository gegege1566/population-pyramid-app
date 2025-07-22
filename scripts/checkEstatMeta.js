require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

// 人口推計関連の統計表を検索
async function searchPopulationTables() {
  try {
    console.log('Searching for population statistics tables...\n');
    
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList', {
      params: {
        appId: API_KEY,
        searchWord: '人口推計 年齢',
        statsCode: '00200524' // 人口推計の統計コード
      }
    });

    const tables = response.data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
    
    // 年齢階級別人口のテーブルを探す
    const relevantTables = tables.filter(table => {
      const title = table.TITLE['$'];
      return title.includes('年齢') && 
             (title.includes('都道府県') || title.includes('全国')) &&
             (title.includes('5歳階級') || title.includes('各歳'));
    });

    console.log(`Found ${relevantTables.length} relevant tables:\n`);
    
    relevantTables.forEach(table => {
      console.log(`ID: ${table['@id']}`);
      console.log(`Title: ${table.TITLE['$']}`);
      console.log(`Survey Date: ${table.SURVEY_DATE}`);
      console.log(`Updated: ${table.UPDATED_DATE}\n`);
    });

    return relevantTables;
  } catch (error) {
    console.error('Error searching tables:', error.message);
    return [];
  }
}

// 特定の統計表のメタ情報を取得
async function getTableMetaInfo(statsDataId) {
  try {
    console.log(`\nGetting meta info for table ${statsDataId}...\n`);
    
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
      params: {
        appId: API_KEY,
        statsDataId: statsDataId
      }
    });

    const metaInfo = response.data.GET_META_INFO;
    
    // カテゴリ情報を表示
    if (metaInfo?.CLASS_INF?.CLASS_OBJ) {
      const classObjs = Array.isArray(metaInfo.CLASS_INF.CLASS_OBJ) 
        ? metaInfo.CLASS_INF.CLASS_OBJ 
        : [metaInfo.CLASS_INF.CLASS_OBJ];
      
      classObjs.forEach(classObj => {
        console.log(`\nCategory: ${classObj['@name']} (ID: ${classObj['@id']})`);
        
        const classes = Array.isArray(classObj.CLASS) 
          ? classObj.CLASS 
          : [classObj.CLASS];
        
        if (classObj['@id'] === 'area' || classObj['@id'] === 'cat01') {
          // エリアと地域のコードを表示
          classes.slice(0, 5).forEach(cls => {
            console.log(`  - ${cls['@name']} (Code: ${cls['@code']})`);
          });
          if (classes.length > 5) {
            console.log(`  ... and ${classes.length - 5} more`);
          }
        }
      });
    }

    return metaInfo;
  } catch (error) {
    console.error('Error getting meta info:', error.message);
    return null;
  }
}

async function main() {
  // 人口推計テーブルを検索
  const tables = await searchPopulationTables();
  
  // 特定のテーブルのメタ情報を取得
  await getTableMetaInfo('0003448237');
}

main();