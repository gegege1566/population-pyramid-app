#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class FullDataAPIService {
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
    this.requestCount = 0;
    this.startTime = Date.now();
  }

  async fetchData(seriesId, regionCode) {
    const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${regionCode}`;
    
    try {
      this.requestCount++;
      
      // Progress logging
      if (this.requestCount % 50 === 0) {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        console.log(`📊 進捗: ${this.requestCount}リクエスト完了 (${elapsed}秒経過)`);
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status !== "0") {
        // 95-99歳は多くの場合データがないので警告レベルを下げる
        if (seriesId.endsWith('010205')) {
          // 95-99歳の場合は詳細ログなし
        } else {
          console.warn(`⚠️ API Error for ${seriesId}: ${data.GET_STATS?.RESULT?.errorMsg}`);
        }
        return [];
      }

      return data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
      
    } catch (error) {
      console.error(`❌ Error fetching ${seriesId} for ${regionCode}:`, error.message);
      return [];
    }
  }

  async getPopulationData(prefCode, year) {
    const prefName = prefCode === '00000' ? '全国' : this.PREFECTURE_CODES[prefCode]?.name || prefCode;
    
    const regionCode = prefCode === '00000' ? '00000' : this.PREFECTURE_CODES[prefCode]?.code;
    if (!regionCode) {
      throw new Error(`Unknown prefecture code: ${prefCode}`);
    }

    const allData = [];
    let seriesCount = 0;

    for (const seriesId of this.ALL_SERIES_IDS) {
      seriesCount++;
      
      // Rate limiting - より短い間隔で実行（APIが安定しているため）
      if (seriesCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
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

    return allData;
  }

  validateData(data, prefName) {
    if (!data || data.length === 0) {
      console.log(`❌ ${prefName}: データなし`);
      return false;
    }

    // 重複チェック
    const genders = ['male', 'female'];
    let totalDuplicates = 0;

    for (const gender of genders) {
      const genderData = data.filter(d => d.gender === gender);
      const valueMap = new Map();
      
      genderData.forEach(d => {
        if (!valueMap.has(d.population)) {
          valueMap.set(d.population, []);
        }
        valueMap.get(d.population).push(d.ageGroup);
      });
      
      const duplicates = Array.from(valueMap.entries()).filter(([value, ageGroups]) => ageGroups.length > 1);
      totalDuplicates += duplicates.length;
      
      if (duplicates.length > 0) {
        console.log(`  ⚠️ ${gender}: ${duplicates.length}個の重複値`);
      }
    }

    if (totalDuplicates === 0) {
      console.log(`  ✅ ${prefName}: データ正常 (${data.length}レコード)`);
      return true;
    } else {
      console.log(`  ❌ ${prefName}: ${totalDuplicates}個の重複問題`);
      return false;
    }
  }
}

async function fetchAllPrefectures() {
  console.log('🌏 全都道府県データをAPIから取得開始...');
  
  const apiService = new FullDataAPIService();
  const dataDir = path.join(__dirname, 'public/data/population');
  
  // まず2025年データでテスト（1年度のみ）
  console.log('\n📊 2025年データの取得・検証...');
  const year = 2025;
  const prefectureCodes = Object.keys(apiService.PREFECTURE_CODES);
  
  // 既存ファイルを読み込み
  const existingFilePath = path.join(dataDir, `population_${year}.json`);
  let allData = {};
  
  if (fs.existsSync(existingFilePath)) {
    allData = JSON.parse(fs.readFileSync(existingFilePath, 'utf8'));
    console.log('📋 既存ファイルを読み込みました');
  }

  let successCount = 0;
  let errorCount = 0;

  // 小さなバッチで処理（5都道府県ずつ）
  const batchSize = 5;
  for (let i = 0; i < prefectureCodes.length; i += batchSize) {
    const batch = prefectureCodes.slice(i, i + batchSize);
    
    console.log(`\n🔄 バッチ ${Math.floor(i/batchSize) + 1}/${Math.ceil(prefectureCodes.length/batchSize)}: ${batch.map(code => apiService.PREFECTURE_CODES[code].name).join(', ')}`);
    
    for (const prefCode of batch) {
      try {
        const prefName = apiService.PREFECTURE_CODES[prefCode].name;
        console.log(`  📊 ${prefName} 取得中...`);
        
        const prefData = await apiService.getPopulationData(prefCode, year);
        
        if (apiService.validateData(prefData, prefName)) {
          allData[prefCode] = prefData;
          successCount++;
        } else {
          errorCount++;
          console.log(`  ⚠️ ${prefName}: データに問題があります（既存データを保持）`);
        }
        
      } catch (error) {
        console.error(`  ❌ ${apiService.PREFECTURE_CODES[prefCode].name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // バッチ間の待機
    if (i + batchSize < prefectureCodes.length) {
      console.log('  ⏸️ バッチ間待機 (3秒)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // ファイル保存
  fs.writeFileSync(existingFilePath, JSON.stringify(allData, null, 2));
  
  console.log(`\n✅ 2025年データ更新完了:`);
  console.log(`  成功: ${successCount}都道府県`);
  console.log(`  エラー: ${errorCount}都道府県`);
  console.log(`  総APIリクエスト: ${apiService.requestCount}`);
  
  if (successCount > 40) { // 47都道府県中40以上成功なら他の年度も処理
    console.log('\n🚀 2025年が成功したので、他の年度も処理します...');
    
    const otherYears = [2030, 2035, 2040, 2045, 2050];
    
    for (const otherYear of otherYears) {
      console.log(`\n📊 ${otherYear}年データの取得...`);
      
      const otherFilePath = path.join(dataDir, `population_${otherYear}.json`);
      let otherAllData = {};
      
      if (fs.existsSync(otherFilePath)) {
        otherAllData = JSON.parse(fs.readFileSync(otherFilePath, 'utf8'));
      }

      let yearSuccessCount = 0;
      
      // 成功した都道府県のみ更新
      for (const prefCode of Object.keys(allData)) {
        try {
          const prefName = apiService.PREFECTURE_CODES[prefCode].name;
          console.log(`  📊 ${prefName} ${otherYear}年...`);
          
          const prefData = await apiService.getPopulationData(prefCode, otherYear);
          
          if (apiService.validateData(prefData, prefName)) {
            otherAllData[prefCode] = prefData;
            yearSuccessCount++;
          }
          
        } catch (error) {
          console.error(`  ❌ ${apiService.PREFECTURE_CODES[prefCode].name} ${otherYear}: ${error.message}`);
        }
      }
      
      fs.writeFileSync(otherFilePath, JSON.stringify(otherAllData, null, 2));
      console.log(`✅ ${otherYear}年: ${yearSuccessCount}都道府県更新完了`);
    }
  }
  
  console.log('\n🎉 全都道府県データ取得完了！');
}

fetchAllPrefectures().catch(console.error);