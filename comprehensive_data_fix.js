#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class ComprehensiveAPIService {
  constructor() {
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    
    // 系列IDから年齢階級・性別へのマッピング
    this.SERIES_INFO = {
      // 男性
      "0201130120000010010": { ageGroup: "0-4", gender: "male" },
      "0201130120000010020": { ageGroup: "5-9", gender: "male" },
      "0201130120000010030": { ageGroup: "10-14", gender: "male" },
      "0201130120000010040": { ageGroup: "15-19", gender: "male" },
      "0201130120000010050": { ageGroup: "20-24", gender: "male" },
      "0201130120000010060": { ageGroup: "25-29", gender: "male" },
      "0201130120000010070": { ageGroup: "30-34", gender: "male" },
      "0201130120000010080": { ageGroup: "35-39", gender: "male" },
      "0201130120000010090": { ageGroup: "40-44", gender: "male" },
      "0201130120000010100": { ageGroup: "45-49", gender: "male" },
      "0201130120000010110": { ageGroup: "50-54", gender: "male" },
      "0201130120000010120": { ageGroup: "55-59", gender: "male" },
      "0201130120000010130": { ageGroup: "60-64", gender: "male" },
      "0201130120000010140": { ageGroup: "65-69", gender: "male" },
      "0201130120000010150": { ageGroup: "70-74", gender: "male" },
      "0201130120000010160": { ageGroup: "75-79", gender: "male" },
      "0201130120000010170": { ageGroup: "80-84", gender: "male" },
      "0201130120000010180": { ageGroup: "85-89", gender: "male" },
      "0201130120000010200": { ageGroup: "90-94", gender: "male" },
      "0201130120000010205": { ageGroup: "95-99", gender: "male" },
      // 女性
      "0201130220000010010": { ageGroup: "0-4", gender: "female" },
      "0201130220000010020": { ageGroup: "5-9", gender: "female" },
      "0201130220000010030": { ageGroup: "10-14", gender: "female" },
      "0201130220000010040": { ageGroup: "15-19", gender: "female" },
      "0201130220000010050": { ageGroup: "20-24", gender: "female" },
      "0201130220000010060": { ageGroup: "25-29", gender: "female" },
      "0201130220000010070": { ageGroup: "30-34", gender: "female" },
      "0201130220000010080": { ageGroup: "35-39", gender: "female" },
      "0201130220000010090": { ageGroup: "40-44", gender: "female" },
      "0201130220000010100": { ageGroup: "45-49", gender: "female" },
      "0201130220000010110": { ageGroup: "50-54", gender: "female" },
      "0201130220000010120": { ageGroup: "55-59", gender: "female" },
      "0201130220000010130": { ageGroup: "60-64", gender: "female" },
      "0201130220000010140": { ageGroup: "65-69", gender: "female" },
      "0201130220000010150": { ageGroup: "70-74", gender: "female" },
      "0201130220000010160": { ageGroup: "75-79", gender: "female" },
      "0201130220000010170": { ageGroup: "80-84", gender: "female" },
      "0201130220000010180": { ageGroup: "85-89", gender: "female" },
      "0201130220000010200": { ageGroup: "90-94", gender: "female" },
      "0201130220000010205": { ageGroup: "95-99", gender: "female" }
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
  }

  async fetchSingleSeries(seriesId, regionCode, year) {
    const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${regionCode}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.GET_STATS?.RESULT?.status !== "0") {
        return null;
      }

      const dataObjects = data.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
      
      // 指定年度のデータを検索
      for (const obj of dataObjects) {
        const value = obj.VALUE;
        const timeCode = value['@time'];
        const dataYear = parseInt(timeCode.substring(0, 4));
        
        if (dataYear === year) {
          const rawValue = parseInt(value['$']);
          if (!isNaN(rawValue)) {
            return Math.round(rawValue / 1000); // 千人単位に変換
          }
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Error fetching ${seriesId}:`, error.message);
      return null;
    }
  }

  async getCompletePopulationData(prefCode, year) {
    const prefName = prefCode === '00000' ? '全国' : this.PREFECTURE_CODES[prefCode]?.name || prefCode;
    
    const regionCode = prefCode === '00000' ? '00000' : this.PREFECTURE_CODES[prefCode]?.code;
    if (!regionCode) {
      throw new Error(`Unknown prefecture code: ${prefCode}`);
    }

    console.log(`📊 ${prefName} ${year}年 完全データ取得中...`);
    
    const allData = [];
    const seriesIds = Object.keys(this.SERIES_INFO);

    for (const seriesId of seriesIds) {
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      const population = await this.fetchSingleSeries(seriesId, regionCode, year);
      
      if (population !== null) {
        const info = this.SERIES_INFO[seriesId];
        
        allData.push({
          year: year,
          prefecture: prefName,
          prefectureCode: prefCode,
          ageGroup: info.ageGroup,
          gender: info.gender,
          population: population
        });
      }
    }

    return allData;
  }

  strictValidateData(data, prefName) {
    if (!data || data.length === 0) {
      console.log(`  ❌ ${prefName}: データなし`);
      return false;
    }

    // 期待される年齢階級（95-99は除く）
    const expectedAgeGroups = [
      "0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", 
      "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80-84", "85-89", "90-94"
    ];
    
    const maleData = data.filter(d => d.gender === 'male');
    const femaleData = data.filter(d => d.gender === 'female');
    
    // 完全性チェック - 期待される年齢階級がすべて存在するか
    let missingCount = 0;
    expectedAgeGroups.forEach(ageGroup => {
      if (!maleData.find(d => d.ageGroup === ageGroup)) {
        missingCount++;
      }
      if (!femaleData.find(d => d.ageGroup === ageGroup)) {
        missingCount++;
      }
    });
    
    // 重複チェック（厳格）
    const maleDuplicates = this.findStrictDuplicates(maleData);
    const femaleDuplicates = this.findStrictDuplicates(femaleData);
    
    // 異常値チェック（人口が0または異常に大きい値）
    const maleAnomalies = maleData.filter(d => d.population <= 0 || d.population > 1000);
    const femaleAnomalies = femaleData.filter(d => d.population <= 0 || d.population > 1000);
    
    // 人口ピラミッドの形状チェック（基本的な妥当性）
    const maleTotal = maleData.reduce((sum, d) => sum + d.population, 0);
    const femaleTotal = femaleData.reduce((sum, d) => sum + d.population, 0);
    const ratio = maleTotal / femaleTotal;
    
    let issues = 0;
    
    if (missingCount > 0) {
      console.log(`  ❌ ${prefName}: ${missingCount}個の年齢階級データが欠損`);
      issues += missingCount;
    }
    
    if (maleDuplicates.length > 0) {
      console.log(`  ❌ ${prefName} 男性重複: ${maleDuplicates.length}個`);
      maleDuplicates.forEach(dup => {
        console.log(`    値 ${dup.value}: ${dup.ageGroups.join(', ')}`);
      });
      issues += maleDuplicates.length;
    }
    
    if (femaleDuplicates.length > 0) {
      console.log(`  ❌ ${prefName} 女性重複: ${femaleDuplicates.length}個`);
      femaleDuplicates.forEach(dup => {
        console.log(`    値 ${dup.value}: ${dup.ageGroups.join(', ')}`);
      });
      issues += femaleDuplicates.length;
    }
    
    if (maleAnomalies.length > 0 || femaleAnomalies.length > 0) {
      console.log(`  ❌ ${prefName}: 異常値 ${maleAnomalies.length + femaleAnomalies.length}個`);
      issues++;
    }
    
    if (ratio < 0.8 || ratio > 1.2) {
      console.log(`  ❌ ${prefName}: 男女比異常 (${ratio.toFixed(2)})`);
      issues++;
    }
    
    if (issues === 0) {
      console.log(`  ✅ ${prefName}: 完全に正常 (${data.length}レコード, 男女比${ratio.toFixed(2)})`);
      return true;
    } else {
      console.log(`  ❌ ${prefName}: ${issues}個の問題`);
      return false;
    }
  }
  
  findStrictDuplicates(genderData) {
    const valueMap = new Map();
    
    genderData.forEach(d => {
      if (!valueMap.has(d.population)) {
        valueMap.set(d.population, []);
      }
      valueMap.get(d.population).push(d.ageGroup);
    });
    
    return Array.from(valueMap.entries())
      .filter(([value, ageGroups]) => ageGroups.length > 1)
      .map(([value, ageGroups]) => ({ value, ageGroups }));
  }
}

async function comprehensiveDataFix() {
  console.log('🌏 全都道府県データの包括的修正開始...');
  
  const apiService = new ComprehensiveAPIService();
  const dataDir = path.join(__dirname, 'public/data/population');
  
  // 2025年データの完全再構築
  const year = 2025;
  const filePath = path.join(dataDir, `population_${year}.json`);
  
  // 既存ファイルを読み込み
  let allData = {};
  if (fs.existsSync(filePath)) {
    allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log('📋 既存ファイル読み込み完了');
  }

  // 全都道府県をチェック（既存データ）
  console.log('\n🔍 既存データの厳格チェック...');
  const prefectureCodes = Object.keys(apiService.PREFECTURE_CODES);
  const problematicPrefectures = [];
  const healthyPrefectures = [];
  
  prefectureCodes.forEach(prefCode => {
    const existingData = allData[prefCode] || [];
    const prefName = apiService.PREFECTURE_CODES[prefCode].name;
    
    if (apiService.strictValidateData(existingData, prefName)) {
      healthyPrefectures.push(prefCode);
    } else {
      problematicPrefectures.push(prefCode);
    }
  });
  
  console.log(`\n📊 結果サマリー:`);
  console.log(`  ✅ 正常: ${healthyPrefectures.length}都道府県`);
  console.log(`  ❌ 問題: ${problematicPrefectures.length}都道府県`);
  
  if (healthyPrefectures.length > 0) {
    console.log(`\n✅ 正常な都道府県:`);
    healthyPrefectures.forEach(code => {
      console.log(`  - ${apiService.PREFECTURE_CODES[code].name}`);
    });
  }

  // 全都道府県のAPIからの再取得（順次処理）
  console.log('\n🔧 全都道府県のAPIからの再取得開始...');
  let totalFixed = 0;
  let totalApiFailed = 0;

  // バックアップ作成
  const backupPath = filePath + '.backup_comprehensive';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2));
    console.log('📋 バックアップ作成完了');
  }

  for (const prefCode of prefectureCodes) {
    try {
      const prefName = apiService.PREFECTURE_CODES[prefCode].name;
      
      const newData = await apiService.getCompletePopulationData(prefCode, year);
      
      if (apiService.strictValidateData(newData, `${prefName}(API)`)) {
        allData[prefCode] = newData;
        totalFixed++;
        console.log(`  ✅ ${prefName}: API取得成功・更新完了`);
      } else {
        totalApiFailed++;
        console.log(`  ❌ ${prefName}: API取得データも問題あり（既存保持）`);
      }
      
    } catch (error) {
      console.error(`  💥 ${apiService.PREFECTURE_CODES[prefCode].name}: ${error.message}`);
      totalApiFailed++;
    }
    
    // 各都道府県間で少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ファイル保存
  fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
  
  console.log(`\n🎉 包括的修正完了:`);
  console.log(`  ✅ API取得成功: ${totalFixed}都道府県`);
  console.log(`  ❌ API取得失敗: ${totalApiFailed}都道府県`);
  console.log(`  📁 ファイル保存: ${filePath}`);
  
  // 最終検証
  console.log('\n🔍 最終データ検証...');
  const finalHealthy = [];
  
  prefectureCodes.forEach(prefCode => {
    const finalData = allData[prefCode] || [];
    const prefName = apiService.PREFECTURE_CODES[prefCode].name;
    
    if (apiService.strictValidateData(finalData, `${prefName}(最終)`)) {
      finalHealthy.push(prefCode);
    }
  });
  
  console.log(`\n📊 最終結果: ${finalHealthy.length}/47 都道府県が完全に正常`);
  
  if (finalHealthy.length > 0) {
    console.log(`\n✅ 最終的に正常な都道府県:`);
    finalHealthy.forEach(code => {
      console.log(`  - ${apiService.PREFECTURE_CODES[code].name}`);
    });
  }
}

comprehensiveDataFix().catch(console.error);