// 全都道府県データをAPIから一括取得するスクリプト
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// e-Stat APIクラス（既存のUnifiedEStatServiceを基に作成）
class BulkDataFetcher {
  constructor() {
    this.apiKey = process.env.REACT_APP_ESTAT_API_KEY;
    if (!this.apiKey) {
      throw new Error('API key not found in .env file');
    }
    
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    this.outputDir = path.join(__dirname, 'public/data/population_api');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // 都道府県コードマップ
    this.prefectureCodes = {
      '01': { code: '01000', name: '北海道' }, '02': { code: '02000', name: '青森県' },
      '03': { code: '03000', name: '岩手県' }, '04': { code: '04000', name: '宮城県' },
      '05': { code: '05000', name: '秋田県' }, '06': { code: '06000', name: '山形県' },
      '07': { code: '07000', name: '福島県' }, '08': { code: '08000', name: '茨城県' },
      '09': { code: '09000', name: '栃木県' }, '10': { code: '10000', name: '群馬県' },
      '11': { code: '11000', name: '埼玉県' }, '12': { code: '12000', name: '千葉県' },
      '13': { code: '13000', name: '東京都' }, '14': { code: '14000', name: '神奈川県' },
      '15': { code: '15000', name: '新潟県' }, '16': { code: '16000', name: '富山県' },
      '17': { code: '17000', name: '石川県' }, '18': { code: '18000', name: '福井県' },
      '19': { code: '19000', name: '山梨県' }, '20': { code: '20000', name: '長野県' },
      '21': { code: '21000', name: '岐阜県' }, '22': { code: '22000', name: '静岡県' },
      '23': { code: '23000', name: '愛知県' }, '24': { code: '24000', name: '三重県' },
      '25': { code: '25000', name: '滋賀県' }, '26': { code: '26000', name: '京都府' },
      '27': { code: '27000', name: '大阪府' }, '28': { code: '28000', name: '兵庫県' },
      '29': { code: '29000', name: '奈良県' }, '30': { code: '30000', name: '和歌山県' },
      '31': { code: '31000', name: '鳥取県' }, '32': { code: '32000', name: '島根県' },
      '33': { code: '33000', name: '岡山県' }, '34': { code: '34000', name: '広島県' },
      '35': { code: '35000', name: '山口県' }, '36': { code: '36000', name: '徳島県' },
      '37': { code: '37000', name: '香川県' }, '38': { code: '38000', name: '愛媛県' },
      '39': { code: '39000', name: '高知県' }, '40': { code: '40000', name: '福岡県' },
      '41': { code: '41000', name: '佐賀県' }, '42': { code: '42000', name: '長崎県' },
      '43': { code: '43000', name: '熊本県' }, '44': { code: '44000', name: '大分県' },
      '45': { code: '45000', name: '宮崎県' }, '46': { code: '46000', name: '鹿児島県' },
      '47': { code: '47000', name: '沖縄県' }
    };
    
    // 系列IDから年齢階級へのマッピング
    this.seriesToAge = {
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
    
    // 年齢階級別系列ID
    this.allSeriesIds = {
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
    
    this.availableYears = [2025, 2030, 2035, 2040, 2045, 2050];
  }

  async fetchRequest(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async fetchPrefectureData(prefCode, year) {
    console.log(`📊 Fetching ${this.prefectureCodes[prefCode].name} ${year}年 data...`);
    
    const prefInfo = this.prefectureCodes[prefCode];
    const allData = [];

    // 男性データを取得
    for (const seriesId of this.allSeriesIds.male) {
      try {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${prefInfo.code}`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue;
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = this.seriesToAge[seriesId];
            if (ageGroup) {
              allData.push({
                year: dataYear,
                prefecture: prefInfo.name,
                prefectureCode: prefCode,
                ageGroup,
                gender: 'male',
                population: Math.round(parseInt(value['$']) / 1000) // 千人単位に変換
              });
            }
          }
        }

        // レート制限回避
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠ Failed to fetch male ${seriesId} for ${prefCode}: ${error.message}`);
      }
    }

    // 女性データを取得
    for (const seriesId of this.allSeriesIds.female) {
      try {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${prefInfo.code}`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue;
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = this.seriesToAge[seriesId];
            if (ageGroup) {
              allData.push({
                year: dataYear,
                prefecture: prefInfo.name,
                prefectureCode: prefCode,
                ageGroup,
                gender: 'female',
                population: Math.round(parseInt(value['$']) / 1000) // 千人単位に変換
              });
            }
          }
        }

        // レート制限回避
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠ Failed to fetch female ${seriesId} for ${prefCode}: ${error.message}`);
      }
    }

    console.log(`✅ ${prefInfo.name} ${year}年: ${allData.length} records fetched`);
    return allData;
  }

  async fetchNationalDataDirect(year) {
    console.log(`🌏 Fetching national data for ${year} directly from API...`);
    
    const allData = [];

    // 男性データを取得
    for (const seriesId of this.allSeriesIds.male) {
      try {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=00000`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue;
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = this.seriesToAge[seriesId];
            if (ageGroup) {
              const rawValue = parseInt(value['$']);
              const processedValue = Math.round(rawValue / 1000 / 1000); // 千人単位に変換
              
              allData.push({
                year: dataYear,
                prefecture: '全国',
                prefectureCode: '00000',
                ageGroup,
                gender: 'male',
                population: processedValue
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠ Failed to fetch national male ${seriesId}: ${error.message}`);
      }
    }

    // 女性データを取得
    for (const seriesId of this.allSeriesIds.female) {
      try {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=00000`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue;
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time'];
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = this.seriesToAge[seriesId];
            if (ageGroup) {
              const rawValue = parseInt(value['$']);
              const processedValue = Math.round(rawValue / 1000 / 1000); // 千人単位に変換
              
              allData.push({
                year: dataYear,
                prefecture: '全国',
                prefectureCode: '00000',
                ageGroup,
                gender: 'female',
                population: processedValue
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`⚠ Failed to fetch national female ${seriesId}: ${error.message}`);
      }
    }

    console.log(`✅ National ${year}: ${allData.length} records fetched`);
    return allData;
  }

  async fetchAllData() {
    console.log('🚀 Starting bulk data fetch from API...\n');
    
    const totalTasks = this.availableYears.length * (Object.keys(this.prefectureCodes).length + 1); // +1 for national
    let completedTasks = 0;
    
    for (const year of this.availableYears) {
      console.log(`\n📅 === ${year}年のデータ取得開始 ===`);
      
      // 都道府県別データ格納用
      const yearData = {};
      
      // 各都道府県のデータを取得
      for (const prefCode of Object.keys(this.prefectureCodes)) {
        try {
          const prefData = await this.fetchPrefectureData(prefCode, year);
          yearData[prefCode] = prefData;
          
          completedTasks++;
          console.log(`Progress: ${completedTasks}/${totalTasks} (${Math.round(completedTasks/totalTasks*100)}%)`);
          
          // 適度な間隔でデータを保存（メモリ節約）
          if (completedTasks % 10 === 0) {
            console.log('💾 Intermediate save...');
          }
          
        } catch (error) {
          console.error(`❌ Failed to fetch ${prefCode}: ${error.message}`);
          yearData[prefCode] = [];
        }
      }
      
      // 都道府県データをファイルに保存
      const prefectureFile = path.join(this.outputDir, `population_${year}.json`);
      fs.writeFileSync(prefectureFile, JSON.stringify(yearData, null, 2));
      console.log(`✅ Prefecture data saved: ${prefectureFile}`);
      
      // 全国データを直接API取得
      try {
        const nationalData = await this.fetchNationalDataDirect(year);
        const nationalFile = path.join(this.outputDir, `population_national_${year}.json`);
        fs.writeFileSync(nationalFile, JSON.stringify(nationalData, null, 2));
        console.log(`✅ National data saved: ${nationalFile}`);
        
        completedTasks++;
        console.log(`Progress: ${completedTasks}/${totalTasks} (${Math.round(completedTasks/totalTasks*100)}%)`);
        
      } catch (error) {
        console.error(`❌ Failed to fetch national data for ${year}: ${error.message}`);
      }
      
      console.log(`✅ ${year}年のデータ取得完了\n`);
    }
    
    console.log('🎉 All data fetching completed!');
    console.log(`📁 Data saved in: ${this.outputDir}`);
    
    // サマリーレポート生成
    this.generateSummaryReport();
  }

  generateSummaryReport() {
    console.log('\n📊 === Data Summary Report ===');
    
    const reportData = {
      fetchTime: new Date().toISOString(),
      totalYears: this.availableYears.length,
      totalPrefectures: Object.keys(this.prefectureCodes).length,
      dataFiles: []
    };
    
    for (const year of this.availableYears) {
      const prefFile = path.join(this.outputDir, `population_${year}.json`);
      const nationalFile = path.join(this.outputDir, `population_national_${year}.json`);
      
      if (fs.existsSync(prefFile)) {
        const prefData = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
        const totalRecords = Object.values(prefData).reduce((sum, data) => sum + data.length, 0);
        
        reportData.dataFiles.push({
          year,
          type: 'prefectural',
          file: `population_${year}.json`,
          totalRecords,
          fileSize: `${Math.round(fs.statSync(prefFile).size / 1024)}KB`
        });
      }
      
      if (fs.existsSync(nationalFile)) {
        const nationalData = JSON.parse(fs.readFileSync(nationalFile, 'utf8'));
        
        reportData.dataFiles.push({
          year,
          type: 'national',
          file: `population_national_${year}.json`,
          totalRecords: nationalData.length,
          fileSize: `${Math.round(fs.statSync(nationalFile).size / 1024)}KB`
        });
      }
    }
    
    // レポート保存
    const reportFile = path.join(this.outputDir, 'fetch_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    console.log('Files created:');
    reportData.dataFiles.forEach(file => {
      console.log(`  ${file.file}: ${file.totalRecords} records (${file.fileSize})`);
    });
    
    console.log(`\n📋 Detailed report saved: ${reportFile}`);
  }
}

// 実行
async function main() {
  try {
    const fetcher = new BulkDataFetcher();
    await fetcher.fetchAllData();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();