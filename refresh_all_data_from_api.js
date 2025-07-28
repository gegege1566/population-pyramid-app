#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// UnifiedEStatServiceを再実装（Node.js環境用）
class UnifiedEStatService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    
    // 系列IDから年齢階級へのマッピング
    this.SERIES_TO_AGE = {
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

    // 都道府県コード
    this.PREFECTURE_CODES = {
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

    // 年齢階級別系列ID
    this.ALL_SERIES_IDS = {
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
  }

  async fetchRequest(url) {
    const fetch = require('node-fetch');
    console.log(`🌐 API Request: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  async getPopulationData(prefCode, year) {
    console.log(`📊 Fetching data for ${prefCode}-${year} from API...`);
    
    const allData = [];
    const allSeriesIds = [...this.ALL_SERIES_IDS.male, ...this.ALL_SERIES_IDS.female];
    
    for (const seriesId of allSeriesIds) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      
      try {
        const areaCode = prefCode === '00000' ? '00000' : this.PREFECTURE_CODES[prefCode]?.code;
        if (!areaCode && prefCode !== '00000') {
          console.warn(`⚠️ Unknown prefecture code: ${prefCode}`);
          continue;
        }

        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${areaCode}`;

        const apiData = await this.fetchRequest(url);
        
        if (apiData?.GET_STATS?.RESULT?.status !== '0') {
          console.warn(`⚠️ API Error for ${seriesId}: ${apiData?.GET_STATS?.RESULT?.errorMsg || 'Unknown error'}`);
          continue;
        }

        const dataObjects = apiData?.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
        
        dataObjects.forEach(obj => {
          const value = obj.VALUE;
          const timeCode = value['@time']; // 例: "2025CY00"
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          // 指定年度のデータのみ処理
          if (dataYear !== year) {
            return;
          }
          
          const rawValue = parseInt(value['$']);
          
          if (isNaN(rawValue)) {
            console.warn(`⚠️ Invalid value for ${seriesId}: ${value['$']}`);
            return;
          }

          const ageGroup = this.SERIES_TO_AGE[seriesId];
          const gender = seriesId.includes('012000') ? 'male' : 'female';
          const processedValue = Math.round(rawValue / 1000); // 千人単位に変換

          const prefInfo = prefCode === '00000' 
            ? { name: '全国' }
            : this.PREFECTURE_CODES[prefCode];

          allData.push({
            year: dataYear,
            prefecture: prefInfo?.name || `都道府県${prefCode}`,
            prefectureCode: prefCode,
            ageGroup,
            gender,
            population: processedValue
          });
        });

      } catch (error) {
        console.error(`❌ Error fetching ${seriesId}:`, error.message);
        continue;
      }
    }

    console.log(`✅ Fetched ${allData.length} records for ${prefCode}-${year}`);
    return allData;
  }
}

async function refreshAllData() {
  console.log('🔄 APIから全データを再取得してローカルファイルを更新します...');
  
  const apiService = new UnifiedEStatService();
  const dataDir = path.join(__dirname, 'public/data/population');
  const years = [2025, 2030, 2035, 2040, 2045, 2050];
  const prefectureCodes = Object.keys(apiService.PREFECTURE_CODES);

  // 既存ファイルのバックアップ
  console.log('\n📋 既存ファイルのバックアップを作成...');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.includes('.backup'));
  files.forEach(file => {
    const backupPath = path.join(dataDir, `${file}.backup_original`);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(path.join(dataDir, file), backupPath);
      console.log(`  📋 ${file} → ${file}.backup_original`);
    }
  });

  // 全国データの再取得
  console.log('\n🌏 全国データの再取得...');
  for (const year of years) {
    try {
      console.log(`\n📊 ${year}年全国データ取得中...`);
      const nationalData = await apiService.getPopulationData('00000', year);
      
      const filePath = path.join(dataDir, `population_national_${year}.json`);
      fs.writeFileSync(filePath, JSON.stringify(nationalData, null, 2));
      console.log(`✅ 保存完了: population_national_${year}.json (${nationalData.length}件)`);
      
    } catch (error) {
      console.error(`❌ ${year}年全国データ取得エラー:`, error.message);
    }
  }

  // 都道府県データの再取得
  console.log('\n🏢 都道府県データの再取得...');
  for (const year of years) {
    try {
      console.log(`\n📊 ${year}年都道府県データ取得中...`);
      const allPrefData = {};
      
      for (const prefCode of prefectureCodes) {
        try {
          console.log(`  🔍 ${apiService.PREFECTURE_CODES[prefCode].name} (${prefCode})`);
          const prefData = await apiService.getPopulationData(prefCode, year);
          allPrefData[prefCode] = prefData;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`    ❌ ${prefCode} エラー:`, error.message);
          allPrefData[prefCode] = [];
        }
      }
      
      const filePath = path.join(dataDir, `population_${year}.json`);
      fs.writeFileSync(filePath, JSON.stringify(allPrefData, null, 2));
      
      const totalRecords = Object.values(allPrefData).reduce((sum, data) => sum + data.length, 0);
      console.log(`✅ 保存完了: population_${year}.json (${totalRecords}件)`);
      
    } catch (error) {
      console.error(`❌ ${year}年都道府県データ取得エラー:`, error.message);
    }
  }

  console.log('\n✅ 全データの再取得が完了しました！');
}

// 実行
refreshAllData().catch(error => {
  console.error('💥 データ再取得中にエラーが発生しました:', error);
  process.exit(1);
});