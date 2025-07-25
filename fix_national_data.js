// 全国データの単位変換を修正して再取得するスクリプト
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class NationalDataFixer {
  constructor() {
    this.apiKey = process.env.REACT_APP_ESTAT_API_KEY;
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    this.outputDir = path.join(__dirname, 'public/data/population_api');
    
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
    
    this.years = [2025, 2030, 2035, 2040, 2045, 2050];
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

  async fetchNationalDataCorrect(year) {
    console.log(`🌏 Fetching corrected national data for ${year}...`);
    
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
              // 修正: 全国データは実人数なので /1000 のみ適用（千人単位に変換）
              const processedValue = Math.round(rawValue / 1000);
              
              allData.push({
                year: dataYear,
                prefecture: '全国',
                prefectureCode: '00000',
                ageGroup,
                gender: 'male',
                population: processedValue
              });
              
              // デバッグログ（最初の数件のみ）
              if (allData.length <= 3) {
                console.log(`  ${ageGroup} male: ${rawValue} → ${processedValue}千人`);
              }
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
              // 修正: 全国データは実人数なので /1000 のみ適用（千人単位に変換）
              const processedValue = Math.round(rawValue / 1000);
              
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

    // 結果の検証
    const total = allData.reduce((sum, d) => sum + d.population, 0);
    console.log(`✅ ${year}年全国データ: ${allData.length}レコード, 総人口${total}千人`);
    
    if (total < 100000) {
      console.warn(`⚠ 警告: 総人口${total}千人は少なすぎます（正常値: 120,000千人程度）`);
    } else {
      console.log(`✅ 総人口は正常範囲内です`);
    }

    return allData;
  }

  async fixAllNationalData() {
    console.log('🔧 全国データの単位修正を開始...\n');
    
    for (const year of this.years) {
      try {
        const correctedData = await this.fetchNationalDataCorrect(year);
        
        // ファイルに保存
        const outputFile = path.join(this.outputDir, `population_national_${year}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(correctedData, null, 2));
        
        const fileSize = Math.round(fs.statSync(outputFile).size / 1024);
        console.log(`✅ ${year}年修正データ保存: ${outputFile} (${fileSize}KB)`);
        
        // サンプルデータ表示
        const sample40_44 = correctedData.filter(d => d.ageGroup === '40-44');
        if (sample40_44.length > 0) {
          const total40_44 = sample40_44.reduce((sum, d) => sum + d.population, 0);
          console.log(`  40-44歳: ${total40_44}千人 (${sample40_44.map(d => `${d.gender}:${d.population}`).join(', ')})`);
        }
        
      } catch (error) {
        console.error(`❌ ${year}年データ修正エラー:`, error.message);
      }
      
      console.log(''); // 改行
    }
    
    console.log('🎉 全国データ修正完了！');
    this.generateComparisonReport();
  }

  generateComparisonReport() {
    console.log('\n📊 === 修正前後比較レポート ===');
    
    // 2025年データで比較
    try {
      const correctedData = JSON.parse(fs.readFileSync(
        path.join(this.outputDir, 'population_national_2025.json'), 'utf8'
      ));
      
      const totalCorrected = correctedData.reduce((sum, d) => sum + d.population, 0);
      
      console.log('2025年全国データ:');
      console.log(`  修正後総人口: ${totalCorrected.toLocaleString()}千人`);
      console.log(`  修正前総人口: 125千人 (1/1000に縮小されていた)`);
      console.log(`  修正倍率: ${Math.round(totalCorrected / 125)}倍`);
      
      // 40-44歳のサンプル
      const sample40_44 = correctedData.filter(d => d.ageGroup === '40-44');
      const total40_44 = sample40_44.reduce((sum, d) => sum + d.population, 0);
      
      console.log(`\\n40-44歳グループ:`);
      console.log(`  修正後: ${total40_44}千人`);
      console.log(`  修正前: 8千人`);
      console.log(`  これでグラフが正常に表示されるはずです`);
      
    } catch (error) {
      console.error('比較レポート生成エラー:', error.message);
    }
  }
}

// 実行
async function main() {
  try {
    const fixer = new NationalDataFixer();
    await fixer.fixAllNationalData();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();