require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY;

async function checkAvailableTime() {
  try {
    const response = await axios.get('https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo', {
      params: {
        appId: API_KEY,
        statsDataId: '0003448237'
      }
    });

    const timeData = response.data.GET_META_INFO?.CLASS_INF?.CLASS_OBJ?.find(obj => obj['@id'] === 'time');
    
    if (timeData && timeData.CLASS) {
      console.log('Available time codes:\n');
      const timeCodes = Array.isArray(timeData.CLASS) ? timeData.CLASS : [timeData.CLASS];
      
      // 2020年代のデータを探す
      timeCodes.forEach(time => {
        const code = time['@code'];
        const name = time['@name'];
        if (name.includes('2020') || name.includes('2025') || name.includes('2030')) {
          console.log(`Code: ${code}, Name: ${name}`);
        }
      });
      
      console.log('\nAll recent time codes:');
      timeCodes.slice(-10).forEach(time => {
        console.log(`Code: ${time['@code']}, Name: ${time['@name']}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAvailableTime();