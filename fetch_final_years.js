// 残りの年度（2045年、2050年）を取得するスクリプト
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class FinalYearsFetcher {
  constructor() {
    this.apiKey = process.env.REACT_APP_ESTAT_API_KEY;
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    this.outputDir = path.join(__dirname, 'public/data/population_api');
    
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
    
    // 最終年度
    this.finalYears = [2045, 2050];
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

  async fetchSingleYear(year) {
    console.log(`\n📅 === ${year}年のデータ取得開始 ===`);
    
    const yearData = {};
    let completedPrefectures = 0;
    const totalPrefectures = Object.keys(this.prefectureCodes).length;
    
    // 各都道府県のデータを取得
    for (const prefCode of Object.keys(this.prefectureCodes)) {
      try {
        const prefData = await this.fetchPrefectureData(prefCode, year);
        yearData[prefCode] = prefData;
        
        completedPrefectures++;
        const progress = Math.round((completedPrefectures / totalPrefectures) * 100);
        console.log(`✅ ${this.prefectureCodes[prefCode].name} completed (${completedPrefectures}/${totalPrefectures} - ${progress}%)`);
        
        // 定期的に進捗報告
        if (completedPrefectures % 10 === 0) {
          console.log(`📊 Progress: ${progress}% completed`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${prefCode}: ${error.message}`);
        yearData[prefCode] = [];
      }
    }
    
    // 都道府県データをファイルに保存
    const prefectureFile = path.join(this.outputDir, `population_${year}.json`);
    fs.writeFileSync(prefectureFile, JSON.stringify(yearData, null, 2));
    const fileSize = Math.round(fs.statSync(prefectureFile).size / 1024);
    console.log(`✅ Prefecture data saved: ${prefectureFile} (${fileSize}KB)`);
    
    // 全国データを直接API取得
    try {
      console.log(`🌏 Fetching national data for ${year}...`);
      const nationalData = await this.fetchNationalDataDirect(year);
      const nationalFile = path.join(this.outputDir, `population_national_${year}.json`);
      fs.writeFileSync(nationalFile, JSON.stringify(nationalData, null, 2));
      const nationalFileSize = Math.round(fs.statSync(nationalFile).size / 1024);
      console.log(`✅ National data saved: ${nationalFile} (${nationalFileSize}KB)`);
      
    } catch (error) {
      console.error(`❌ Failed to fetch national data for ${year}: ${error.message}`);
    }
    
    console.log(`🎉 ${year}年のデータ取得完了\n`);
  }

  async fetchPrefectureData(prefCode, year) {
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
                population: Math.round(parseInt(value['$']) / 1000)
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 80)); // より短い間隔
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
                population: Math.round(parseInt(value['$']) / 1000)
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 80)); // より短い間隔
      } catch (error) {
        console.warn(`⚠ Failed to fetch female ${seriesId} for ${prefCode}: ${error.message}`);
      }
    }

    return allData;
  }

  async fetchNationalDataDirect(year) {
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
              const processedValue = Math.round(rawValue / 1000 / 1000);
              
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

        await new Promise(resolve => setTimeout(resolve, 80));
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
              const processedValue = Math.round(rawValue / 1000 / 1000);
              
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

        await new Promise(resolve => setTimeout(resolve, 80));
      } catch (error) {
        console.warn(`⚠ Failed to fetch national female ${seriesId}: ${error.message}`);
      }
    }

    return allData;
  }

  async fetchFinalYearsData() {
    console.log('🚀 Fetching final years data (2045, 2050)...\n');
    
    for (const year of this.finalYears) {
      await this.fetchSingleYear(year);
      
      // 年度間で少し休憩
      if (year !== this.finalYears[this.finalYears.length - 1]) {
        console.log('⏱️  Taking a short break between years...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('🎉 All final years data fetching completed!');
    this.generateCompleteSummaryReport();
  }

  generateCompleteSummaryReport() {
    console.log('\n📊 === Complete Data Summary Report ===');
    
    const allYears = [2025, 2030, 2035, 2040, 2045, 2050];
    let totalSize = 0;
    let completedYears = [];
    
    console.log('年度別データファイル確認:');
    allYears.forEach(year => {
      const prefFile = path.join(this.outputDir, `population_${year}.json`);
      const nationalFile = path.join(this.outputDir, `population_national_${year}.json`);
      
      let yearComplete = true;
      console.log(`\n${year}年:`);
      
      if (fs.existsSync(prefFile)) {
        const size = Math.round(fs.statSync(prefFile).size / 1024);
        console.log(`  ✅ 都道府県データ: ${size}KB`);
        totalSize += size;
      } else {
        console.log(`  ❌ 都道府県データ: 未取得`);
        yearComplete = false;
      }
      
      if (fs.existsSync(nationalFile)) {
        const size = Math.round(fs.statSync(nationalFile).size / 1024);
        console.log(`  ✅ 全国データ: ${size}KB`);
        totalSize += size;
      } else {
        console.log(`  ❌ 全国データ: 未取得`);
        yearComplete = false;
      }
      
      if (yearComplete) {
        completedYears.push(year);
      }
    });
    
    console.log(`\n📈 取得完了統計:`);
    console.log(`  完了年度: ${completedYears.length}/${allYears.length}年度 (${completedYears.join(', ')})`);
    console.log(`  総データサイズ: ${totalSize}KB`);
    
    // 北海道40-44歳の全年度推移
    if (completedYears.length > 0) {
      console.log('\n🏔️ 北海道40-44歳の全年度推移:');
      
      const hokkaidoTrend = [];
      completedYears.forEach(year => {
        const prefFile = path.join(this.outputDir, `population_${year}.json`);
        try {
          const prefData = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
          if (prefData['01']) {
            const hokkaido40_44 = prefData['01'].filter(d => d.ageGroup === '40-44');
            const total = hokkaido40_44.reduce((sum, d) => sum + d.population, 0);
            hokkaidoTrend.push({ year, total });
          }
        } catch (error) {
          console.log(`⚠ ${year}年データ読み込みエラー`);
        }
      });
      
      hokkaidoTrend.forEach((data, index) => {
        if (index > 0) {
          const prev = hokkaidoTrend[index - 1];
          const change = data.total - prev.total;
          const changeRate = prev.total > 0 ? ((change / prev.total) * 100) : 0;
          console.log(`  ${data.year}年: ${data.total}千人 (前期比: ${change > 0 ? '+' : ''}${change}千人, ${changeRate > 0 ? '+' : ''}${changeRate.toFixed(1)}%)`);
        } else {
          console.log(`  ${data.year}年: ${data.total}千人 (基準年)`);
        }
      });
    }
    
    console.log('\n✅ 全年度APIデータ取得プロジェクト完了！');
    console.log('📁 データ保存先: public/data/population_api/');
  }
}

// 実行
async function main() {
  try {
    const fetcher = new FinalYearsFetcher();
    await fetcher.fetchFinalYearsData();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();