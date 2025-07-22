const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY || '';
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

async function debugApiResponse() {
  try {
    const response = await axios.get(`${BASE_URL}/json/getStatsData`, {
      params: {
        appId: API_KEY,
        statsDataId: '0003448237',
        metaGetFlg: 'Y',
        cntGetFlg: 'N',
        cdArea: '13000',
        cdTime: '1601',
        limit: 10
      }
    });

    console.log('API Response Structure:');
    console.log('======================');
    
    const data = response.data.GET_STATS_DATA;
    
    // メタデータ確認
    const classInfo = data?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ || [];
    console.log('\nClass Information:');
    classInfo.forEach(cls => {
      console.log(`\n${cls['@name']}:`);
      const items = Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS];
      items.forEach(item => {
        console.log(`  ${item['@code']}: ${item['@name']}`);
      });
    });
    
    // データの最初の数件を確認
    console.log('\n\nFirst 5 data records:');
    const values = data?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    values.slice(0, 5).forEach(value => {
      console.log(`  Area: ${value['@area']}, Gender: ${value['@cat01']}, Age: ${value['@cat02']}, Population: ${value['$']}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugApiResponse();