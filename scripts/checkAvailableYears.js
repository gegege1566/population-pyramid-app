require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function checkAvailableYears() {
  try {
    console.log('Checking available years in e-Stat API...\n');
    
    // メタ情報を取得
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
      params: {
        appId: API_KEY,
        statsDataId: '0003448237'
      }
    });

    const classObjs = response.data.GET_META_INFO?.CLASS_INF?.CLASS_OBJ;
    const timeObj = classObjs?.find(obj => obj['@id'] === 'time');
    
    if (timeObj && timeObj.CLASS) {
      const timeCodes = Array.isArray(timeObj.CLASS) ? timeObj.CLASS : [timeObj.CLASS];
      
      console.log('Available years:');
      console.log('================');
      
      // 年度コードと年度名のマッピング
      const yearMapping = {};
      timeCodes.forEach(time => {
        const code = time['@code'];
        const name = time['@name'];
        yearMapping[code] = name;
        console.log(`Code: ${code} => ${name}`);
      });
      
      console.log('\n5年刻みで利用可能な年度:');
      console.log('========================');
      
      // 5年刻みの年度を探す
      const targetYears = [1950, 1955, 1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 
                          2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050];
      
      const availableFiveYearData = {};
      
      timeCodes.forEach(time => {
        const name = time['@name'];
        targetYears.forEach(year => {
          if (name.includes(year + '年')) {
            availableFiveYearData[year] = {
              code: time['@code'],
              name: name
            };
          }
        });
      });
      
      Object.keys(availableFiveYearData)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(year => {
          console.log(`${year}年: Code=${availableFiveYearData[year].code}`);
        });
      
      // テスト用：2020年の東京都データを取得
      console.log('\n\nTesting 2020 data retrieval...');
      const testResponse = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
        params: {
          appId: API_KEY,
          statsDataId: '0003448237',
          cdArea: '13000',
          cdTime: availableFiveYearData[2020]?.code || '1301',
          cdCat01: '001',
          cdCat02: '01001',
          limit: 1
        }
      });
      
      if (testResponse.data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE?.[0]) {
        const value = testResponse.data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0];
        console.log('✓ 2020 data exists:', value);
      }
      
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAvailableYears();