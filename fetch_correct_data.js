#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class EStatAPIService {
  constructor() {
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

    // 全系列ID
    this.ALL_SERIES_IDS = Object.keys(this.SERIES_TO_AGE);
  }

  async fetchData(seriesId, regionCode) {
    const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${regionCode}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status !== "0") {
        console.warn(`⚠️ API Error for ${seriesId}: ${data.GET_STATS?.RESULT?.errorMsg}`);
        return [];
      }

      return data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
      
    } catch (error) {
      console.error(`❌ Error fetching ${seriesId}:`, error.message);
      return [];
    }
  }

  async getPopulationData(prefCode, year) {
    console.log(`📊 Fetching ${prefCode === '00000' ? '全国' : this.PREFECTURE_CODES[prefCode]?.name || prefCode} - ${year}年...`);
    
    const regionCode = prefCode === '00000' ? '00000' : this.PREFECTURE_CODES[prefCode]?.code;
    if (!regionCode) {
      throw new Error(`Unknown prefecture code: ${prefCode}`);
    }

    const allData = [];
    let requestCount = 0;

    for (const seriesId of this.ALL_SERIES_IDS) {
      requestCount++;
      
      // Rate limiting
      if (requestCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const dataObjects = await this.fetchData(seriesId, regionCode);
      
      for (const obj of dataObjects) {
        const value = obj.VALUE;
        const timeCode = value['@time'];
        const dataYear = parseInt(timeCode.substring(0, 4));
        
        // 指定年度のデータのみ処理
        if (dataYear !== year) {
          continue;
        }
        
        const rawValue = parseInt(value['$']);
        if (isNaN(rawValue)) {
          continue;
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
      }
    }

    console.log(`✅ ${allData.length} records fetched for ${prefCode}-${year}`);
    return allData;
  }
}

async function fetchCorrectData() {
  console.log('🔄 APIから正しいデータを取得中...');
  
  const apiService = new EStatAPIService();
  const dataDir = path.join(__dirname, 'public/data/population');
  
  // バックアップの作成
  console.log('\n📋 現在のファイルをバックアップ中...');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.includes('.backup'));
  files.forEach(file => {
    const backupPath = path.join(dataDir, `${file}.backup_before_api_fix`);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(path.join(dataDir, file), backupPath);
      console.log(`  📋 ${file} → ${file}.backup_before_api_fix`);
    }
  });

  // テスト: 群馬県2025年のデータのみ取得
  console.log('\n🔍 テスト: 群馬県2025年データのみ取得...');
  try {
    const gunmaData = await apiService.getPopulationData('10', 2025);
    
    if (gunmaData.length > 0) {
      console.log('\n📊 群馬県2025年データサンプル:');
      const males = gunmaData.filter(d => d.gender === 'male').slice(0, 5);
      males.forEach(d => {
        console.log(`  ${d.ageGroup} ${d.gender}: ${d.population}千人`);
      });
      
      // 重複チェック
      const maleData = gunmaData.filter(d => d.gender === 'male');
      const populations = maleData.map(d => d.population);
      const valueMap = new Map();
      maleData.forEach(d => {
        if (!valueMap.has(d.population)) {
          valueMap.set(d.population, []);
        }
        valueMap.get(d.population).push(d.ageGroup);
      });
      
      const duplicates = Array.from(valueMap.entries()).filter(([value, ageGroups]) => ageGroups.length > 1);
      
      if (duplicates.length === 0) {
        console.log('  ✅ 重複値なし - データは正常です！');
        
        console.log('\n🚀 群馬県のテストが成功したので、全データを取得開始...');
        
        // 全国データの取得
        console.log('\n🌏 全国データの取得...');
        const years = [2025, 2030, 2035, 2040, 2045, 2050];
        
        for (const year of years) {
          try {
            const nationalData = await apiService.getPopulationData('00000', year);
            const filePath = path.join(dataDir, `population_national_${year}.json`);
            fs.writeFileSync(filePath, JSON.stringify(nationalData, null, 2));
            console.log(`✅ population_national_${year}.json 保存完了`);
          } catch (error) {
            console.error(`❌ ${year}年全国データエラー:`, error.message);
          }
        }
        
        // 都道府県データの取得（まず群馬県から）
        console.log('\n🏢 都道府県データの取得...');
        const prefectureCodes = ['10']; // まず群馬県のみ
        
        for (const year of years) {
          const allPrefData = {};
          
          for (const prefCode of prefectureCodes) {
            try {
              const prefData = await apiService.getPopulationData(prefCode, year);
              allPrefData[prefCode] = prefData;
            } catch (error) {
              console.error(`❌ ${prefCode}-${year} エラー:`, error.message);
              allPrefData[prefCode] = [];
            }
          }
          
          // 既存ファイルを読み込んで群馬県データだけ置換
          const existingFilePath = path.join(dataDir, `population_${year}.json`);
          let allData = {};
          
          if (fs.existsSync(existingFilePath)) {
            allData = JSON.parse(fs.readFileSync(existingFilePath, 'utf8'));
          }
          
          // 群馬県データを更新
          Object.assign(allData, allPrefData);
          
          fs.writeFileSync(existingFilePath, JSON.stringify(allData, null, 2));
          console.log(`✅ population_${year}.json 群馬県データ更新完了`);
        }
        
      } else {
        console.log('  ❌ 重複値が見つかりました:');
        duplicates.forEach(([value, ageGroups]) => {
          console.log(`    値 ${value}: ${ageGroups.join(', ')}`);
        });
      }
    } else {
      console.log('❌ データが取得できませんでした');
    }
    
  } catch (error) {
    console.error('💥 エラー:', error.message);
  }
}

fetchCorrectData().catch(console.error);