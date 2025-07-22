const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// 系列IDマップ（年齢階級と性別）
const SERIES_ID_MAP = {
  // 男性
  "0201130120000010010": "0-4", "0201130120000010020": "5-9", "0201130120000010030": "10-14",
  "0201130120000010040": "15-19", "0201130120000010050": "20-24", "0201130120000010060": "25-29",
  "0201130120000010070": "30-34", "0201130120000010080": "35-39", "0201130120000010090": "40-44",
  "0201130120000010100": "45-49", "0201130120000010110": "50-54", "0201130120000010120": "55-59",
  "0201130120000010130": "60-64", "0201130120000010140": "65-69", "0201130120000010150": "70-74",
  "0201130120000010160": "75-79", "0201130120000010170": "80-84", "0201130120000010180": "85-89",
  "0201130120000010200": "90-94", "0201130120000010205": "95-99",
  // 女性
  "0201130220000010010": "0-4", "0201130220000010020": "5-9", "0201130220000010030": "10-14",
  "0201130220000010040": "15-19", "0201130220000010050": "20-24", "0201130220000010060": "25-29",
  "0201130220000010070": "30-34", "0201130220000010080": "35-39", "0201130220000010090": "40-44",
  "0201130220000010100": "45-49", "0201130220000010110": "50-54", "0201130220000010120": "55-59",
  "0201130220000010130": "60-64", "0201130220000010140": "65-69", "0201130220000010150": "70-74",
  "0201130220000010160": "75-79", "0201130220000010170": "80-84", "0201130220000010180": "85-89",
  "0201130220000010200": "90-94", "0201130220000010205": "95-99"
};

const ALL_SERIES_IDS = {
  male: [
    "0201130120000010010", "0201130120000010020", "0201130120000010030", "0201130120000010040", "0201130120000010050",
    "0201130120000010060", "0201130120000010070", "0201130120000010080", "0201130120000010090", "0201130120000010100",
    "0201130120000010110", "0201130120000010120", "0201130120000010130", "0201130120000010140", "0201130120000010150",
    "0201130120000010160", "0201130120000010170", "0201130120000010180", "0201130120000010200", "0201130120000010205"
  ],
  female: [
    "0201130220000010010", "0201130220000010020", "0201130220000010030", "0201130220000010040", "0201130220000010050",
    "0201130220000010060", "0201130220000010070", "0201130220000010080", "0201130220000010090", "0201130220000010100",
    "0201130220000010110", "0201130220000010120", "0201130220000010130", "0201130220000010140", "0201130220000010150",
    "0201130220000010160", "0201130220000010170", "0201130220000010180", "0201130220000010200", "0201130220000010205"
  ]
};

async function fetchRequest(url) {
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

async function fetchNationalDataForYear(year) {
  const baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
  const allData = [];
  
  console.log(`🔍 Fetching national data for ${year}...`);
  
  // 男性データを取得
  console.log('  📊 Fetching male data...');
  for (const [index, seriesId] of ALL_SERIES_IDS.male.entries()) {
    try {
      // レート制限対策
      if (index > 0) await new Promise(resolve => setTimeout(resolve, 100));
      
      const url = `${baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=00000`;
      const response = await fetchRequest(url);
      
      if (response.GET_STATS?.RESULT?.status !== "0") {
        console.warn(`    ⚠ No data for male series ${seriesId}`);
        continue;
      }
      
      const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
      if (!dataObjects || !Array.isArray(dataObjects)) continue;
      
      for (const obj of dataObjects) {
        const value = obj.VALUE;
        const timeCode = value['@time'];
        const dataYear = parseInt(timeCode.substring(0, 4));
        
        if (dataYear === year) {
          allData.push({
            year: dataYear,
            prefecture: '全国',
            prefectureCode: '00000',
            ageGroup: SERIES_ID_MAP[seriesId],
            gender: 'male',
            population: parseInt(value['$']) || 0
          });
        }
      }
    } catch (error) {
      console.warn(`    ⚠ Error fetching male data for ${seriesId}:`, error.message);
    }
  }
  
  // 女性データを取得
  console.log('  📊 Fetching female data...');
  for (const [index, seriesId] of ALL_SERIES_IDS.female.entries()) {
    try {
      // レート制限対策
      if (index > 0) await new Promise(resolve => setTimeout(resolve, 100));
      
      const url = `${baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=00000`;
      const response = await fetchRequest(url);
      
      if (response.GET_STATS?.RESULT?.status !== "0") {
        console.warn(`    ⚠ No data for female series ${seriesId}`);
        continue;
      }
      
      const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
      if (!dataObjects || !Array.isArray(dataObjects)) continue;
      
      for (const obj of dataObjects) {
        const value = obj.VALUE;
        const timeCode = value['@time'];
        const dataYear = parseInt(timeCode.substring(0, 4));
        
        if (dataYear === year) {
          allData.push({
            year: dataYear,
            prefecture: '全国',
            prefectureCode: '00000',
            ageGroup: SERIES_ID_MAP[seriesId],
            gender: 'female',
            population: parseInt(value['$']) || 0
          });
        }
      }
    } catch (error) {
      console.warn(`    ⚠ Error fetching female data for ${seriesId}:`, error.message);
    }
  }
  
  console.log(`  ✅ Fetched ${allData.length} records for ${year}`);
  return allData;
}

async function fetchAllNationalData() {
  const years = [2025, 2030, 2035, 2040, 2045, 2050];
  const allData = {};
  
  for (const year of years) {
    try {
      const yearData = await fetchNationalDataForYear(year);
      if (yearData.length > 0) {
        allData[year] = yearData;
        
        // 個別ファイルとして保存
        const outputDir = path.join(__dirname, '..', 'public', 'data', 'population');
        await fs.mkdir(outputDir, { recursive: true });
        
        const filename = path.join(outputDir, `population_national_${year}.json`);
        await fs.writeFile(filename, JSON.stringify(yearData, null, 2));
        console.log(`💾 Saved to ${filename}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching data for ${year}:`, error.message);
    }
  }
  
  // 全年度データを統合ファイルとして保存
  if (Object.keys(allData).length > 0) {
    const filename = path.join(__dirname, '..', 'public', 'data', 'population', 'population_national_all.json');
    await fs.writeFile(filename, JSON.stringify(allData, null, 2));
    console.log(`\n💾 All national data saved to ${filename}`);
    console.log(`📊 Total years: ${Object.keys(allData).length}`);
    
    // データ統計を表示
    for (const [year, data] of Object.entries(allData)) {
      const maleCount = data.filter(d => d.gender === 'male').length;
      const femaleCount = data.filter(d => d.gender === 'female').length;
      const totalPop = data.reduce((sum, d) => sum + d.population, 0);
      console.log(`  ${year}: ${data.length} records (${maleCount} male, ${femaleCount} female), Total: ${totalPop.toLocaleString()}`);
    }
  }
  
  return allData;
}

// スクリプト実行
if (require.main === module) {
  fetchAllNationalData()
    .then(data => {
      console.log('\n🎉 National data fetch completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllNationalData, fetchNationalDataForYear };