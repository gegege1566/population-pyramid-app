// 95-99歳データのAPI取得テスト
require('dotenv').config();

async function test95_99Data() {
  const apiKey = process.env.REACT_APP_ESTAT_API_KEY;
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  
  console.log('🧪 95-99歳データAPI取得テスト\n');
  
  // 全国の95-99歳データを取得
  const testSeries = [
    { id: "0201130120000010205", gender: "male", desc: "男性95-99歳" },
    { id: "0201130220000010205", gender: "female", desc: "女性95-99歳" }
  ];
  
  for (const series of testSeries) {
    try {
      const url = `${baseUrl}?Lang=JP&IndicatorCode=${series.id}&RegionCode=00000`;
      console.log(`📡 ${series.desc}を取得中...`);
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status !== "0") {
        console.log(`❌ ${series.desc}: APIエラー - ${data.GET_STATS?.RESULT?.errorMsg || 'データなし'}`);
        continue;
      }
      
      const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
      if (!dataObjects || !Array.isArray(dataObjects)) {
        console.log(`❌ ${series.desc}: データオブジェクトが存在しません`);
        continue;
      }
      
      console.log(`✅ ${series.desc}: ${dataObjects.length}件のデータを取得`);
      
      // 2025年データを探す
      const data2025 = dataObjects.find(obj => {
        const timeCode = obj.VALUE['@time'];
        const year = parseInt(timeCode.substring(0, 4));
        return year === 2025;
      });
      
      if (data2025) {
        const rawValue = parseInt(data2025.VALUE['$']);
        const processedValue = Math.round(rawValue / 1000); // 千人単位
        console.log(`  2025年データ: ${rawValue.toLocaleString()}人 → ${processedValue.toLocaleString()}千人`);
      } else {
        console.log(`  ❌ 2025年データが見つかりません`);
      }
      
    } catch (error) {
      console.error(`❌ ${series.desc}取得エラー:`, error.message);
    }
    
    console.log(''); // 改行
  }
  
  // 系列ID "0201130120000010210" も試してみる
  console.log('🔍 代替系列ID "0201130120000010210" もテスト:');
  try {
    const url = `${baseUrl}?Lang=JP&IndicatorCode=0201130120000010210&RegionCode=00000`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.GET_STATS?.RESULT?.status === "0") {
      console.log('✅ 系列ID "0201130120000010210" でデータ取得成功');
    } else {
      console.log('❌ 系列ID "0201130120000010210" でもデータなし');
    }
  } catch (error) {
    console.error('代替系列IDテストエラー:', error.message);
  }
}

test95_99Data();