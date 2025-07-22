const https = require('https');

// 1つの都道府県でテスト
const TEST_PREFECTURE = '13000'; // 東京都
const TEST_SERIES = '0201130120000010010'; // 男性0-4歳

function httpsRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    console.error('Response was not JSON:', data.substring(0, 500));
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function testApi() {
    const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    const url = `${baseUrl}?Lang=JP&IndicatorCode=${TEST_SERIES}&RegionCode=${TEST_PREFECTURE}`;
    
    console.log('Testing API with single series...');
    console.log('URL:', url);
    
    try {
        const response = await httpsRequest(url);
        
        if (response.GET_STATS?.RESULT?.status === "0") {
            const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
            console.log('✅ API Success!');
            console.log('Data count:', dataObjects?.length || 0);
            
            if (dataObjects && dataObjects.length > 0) {
                console.log('Sample data:', JSON.stringify(dataObjects[0], null, 2));
            }
        } else {
            console.log('❌ API Error:', response.GET_STATS?.RESULT?.errorMsg);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testApi();