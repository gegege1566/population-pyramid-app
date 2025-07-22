require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// 都道府県コードマッピング
const PREFECTURE_MAPPING = {
  '01000': { code: '01', name: '北海道' },
  '02000': { code: '02', name: '青森県' },
  '03000': { code: '03', name: '岩手県' },
  '04000': { code: '04', name: '宮城県' },
  '05000': { code: '05', name: '秋田県' },
  '06000': { code: '06', name: '山形県' },
  '07000': { code: '07', name: '福島県' },
  '08000': { code: '08', name: '茨城県' },
  '09000': { code: '09', name: '栃木県' },
  '10000': { code: '10', name: '群馬県' },
  '11000': { code: '11', name: '埼玉県' },
  '12000': { code: '12', name: '千葉県' },
  '13000': { code: '13', name: '東京都' },
  '14000': { code: '14', name: '神奈川県' },
  '15000': { code: '15', name: '新潟県' },
  '16000': { code: '16', name: '富山県' },
  '17000': { code: '17', name: '石川県' },
  '18000': { code: '18', name: '福井県' },
  '19000': { code: '19', name: '山梨県' },
  '20000': { code: '20', name: '長野県' },
  '21000': { code: '21', name: '岐阜県' },
  '22000': { code: '22', name: '静岡県' },
  '23000': { code: '23', name: '愛知県' },
  '24000': { code: '24', name: '三重県' },
  '25000': { code: '25', name: '滋賀県' },
  '26000': { code: '26', name: '京都府' },
  '27000': { code: '27', name: '大阪府' },
  '28000': { code: '28', name: '兵庫県' },
  '29000': { code: '29', name: '奈良県' },
  '30000': { code: '30', name: '和歌山県' },
  '31000': { code: '31', name: '鳥取県' },
  '32000': { code: '32', name: '島根県' },
  '33000': { code: '33', name: '岡山県' },
  '34000': { code: '34', name: '広島県' },
  '35000': { code: '35', name: '山口県' },
  '36000': { code: '36', name: '徳島県' },
  '37000': { code: '37', name: '香川県' },
  '38000': { code: '38', name: '愛媛県' },
  '39000': { code: '39', name: '高知県' },
  '40000': { code: '40', name: '福岡県' },
  '41000': { code: '41', name: '佐賀県' },
  '42000': { code: '42', name: '長崎県' },
  '43000': { code: '43', name: '熊本県' },
  '44000': { code: '44', name: '大分県' },
  '45000': { code: '45', name: '宮崎県' },
  '46000': { code: '46', name: '鹿児島県' },
  '47000': { code: '47', name: '沖縄県' }
};

async function convertApiDataToAppFormat() {
  console.log('=== Converting API Data to App Format ===\n');
  
  try {
    // サンプルAPIデータを読み込み
    const sampleDataPath = path.join(__dirname, 'dashboard_api_sample.json');
    const apiResponse = JSON.parse(await fs.readFile(sampleDataPath, 'utf8'));
    
    const data = apiResponse.GET_STATS.STATISTICAL_DATA;
    console.log('Total API records:', data.RESULT_INF.TOTAL_NUMBER);
    
    const dataObjects = Array.isArray(data.DATA_INF.DATA_OBJ) 
      ? data.DATA_INF.DATA_OBJ 
      : [data.DATA_INF.DATA_OBJ];
    
    console.log(`Processing ${dataObjects.length} data objects...\n`);
    
    // 2020年のデータを抽出（国勢調査データのみ）
    const targetYear = '2020CY00';
    const statCode = '20020101'; // 国勢調査データ
    
    const filteredData = dataObjects.filter(obj => {
      const value = obj.VALUE;
      return value['@time'] === targetYear && value['@stat'] === statCode;
    });
    
    console.log(`Found ${filteredData.length} records for year 2020\n`);
    
    // 都道府県別にデータを整理
    const prefectureData = {};
    
    filteredData.forEach(obj => {
      const value = obj.VALUE;
      const regionCode = value['@regionCode'];
      const population = parseInt(value['$']);
      
      // 都道府県コードの場合のみ処理
      if (PREFECTURE_MAPPING[regionCode]) {
        const prefInfo = PREFECTURE_MAPPING[regionCode];
        
        if (!prefectureData[prefInfo.code]) {
          prefectureData[prefInfo.code] = {
            prefecture: prefInfo.name,
            prefectureCode: prefInfo.code,
            year: 2020,
            totalPopulation: population,
            data: []
          };
        }
      }
    });
    
    // 全国データもチェック
    const nationalData = filteredData.filter(obj => 
      obj.VALUE['@regionCode'] === '00000'
    );
    
    console.log('National data records:', nationalData.length);
    console.log('Prefecture data entries:', Object.keys(prefectureData).length);
    
    // デモ用にサンプルの人口ピラミッドデータを生成
    console.log('\nGenerating population pyramid demo data...');
    
    const ageGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', 
      '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', 
      '65-69', '70-74', '75-79', '80-84', '85+'
    ];
    
    // 東京都のサンプルデータを作成
    const tokyoData = [];
    for (const ageGroup of ageGroups) {
      // 年齢層に応じた人口分布（概算）
      const basePopulation = getAgeGroupPopulation(ageGroup);
      
      tokyoData.push({
        ageGroup,
        gender: 'male',
        population: Math.floor(basePopulation * 0.51) // 男性比率
      });
      
      tokyoData.push({
        ageGroup,
        gender: 'female', 
        population: Math.floor(basePopulation * 0.49) // 女性比率
      });
    }
    
    const convertedData = {
      '13': {
        prefecture: '東京都',
        prefectureCode: '13',
        year: 2020,
        totalPopulation: tokyoData.reduce((sum, item) => sum + item.population, 0),
        data: tokyoData
      }
    };
    
    // アプリ形式で保存
    const dataDir = path.join(__dirname, '..', 'public', 'data', 'population');
    await fs.mkdir(dataDir, { recursive: true });
    
    const outputPath = path.join(dataDir, 'population_2020.json');
    await fs.writeFile(outputPath, JSON.stringify(convertedData, null, 2));
    
    console.log(`✅ Converted data saved to: ${outputPath}`);
    console.log('Data structure:', {
      prefectures: Object.keys(convertedData).length,
      sampleStructure: Object.keys(convertedData['13'])
    });
    
    return convertedData;
    
  } catch (error) {
    console.error('Error converting data:', error.message);
    return null;
  }
}

function getAgeGroupPopulation(ageGroup) {
  // 東京都の年齢層別概算人口（千人単位）
  const populations = {
    '0-4': 450,
    '5-9': 480,
    '10-14': 420,
    '15-19': 480,
    '20-24': 850,
    '25-29': 950,
    '30-34': 920,
    '35-39': 880,
    '40-44': 980,
    '45-49': 920,
    '50-54': 760,
    '55-59': 650,
    '60-64': 720,
    '65-69': 680,
    '70-74': 520,
    '75-79': 380,
    '80-84': 280,
    '85+': 220
  };
  
  return populations[ageGroup] || 400;
}

convertApiDataToAppFormat();