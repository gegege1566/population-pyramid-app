const https = require('https');

// e-Stat Dashboard APIから日本全体の人口データを取得するテスト
async function testNationalDataFetch() {
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  
  // 日本全体の人口データを取得（統計表ID: 0201130）
  // 全国（地域コード00000）のデータを直接取得
  const testUrl = `${baseUrl}?Lang=JP&IndicatorCode=0201130120000010010&RegionCode=00000`;
  
  console.log('🔍 Testing national data API endpoint...');
  console.log('URL:', testUrl);
  
  try {
    const response = await fetchRequest(testUrl);
    console.log('\n✅ API Response Structure:');
    console.log('Status:', response.GET_STATS?.RESULT?.status);
    
    if (response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ) {
      const dataObjects = response.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ;
      console.log(`Data objects count: ${dataObjects.length}`);
      
      if (dataObjects.length > 0) {
        console.log('\n📊 Sample data:');
        const sample = dataObjects[0];
        console.log('Year:', sample.VALUE['@time']);
        console.log('Value:', sample.VALUE['$']);
        console.log('Indicator:', sample.VALUE['@indicator']);
      }
      
      console.log('\n✅ National data API is working!');
      return true;
    } else {
      console.log('\n❌ No data found in response');
      console.log('Full response:', JSON.stringify(response, null, 2));
      return false;
    }
  } catch (error) {
    console.error('\n❌ API Error:', error.message);
    return false;
  }
}

function fetchRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`JSON Parse Error: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// テスト実行
if (require.main === module) {
  testNationalDataFetch()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testNationalDataFetch };