// 95-99歳データの修正・追加スクリプト
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class Fix95_99Data {
  constructor() {
    this.apiKey = process.env.REACT_APP_ESTAT_API_KEY;
    this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
    this.outputDir = path.join(__dirname, 'public/data/population_api');
    
    // 正しい95-99歳の系列ID
    this.correct95_99SeriesIds = {
      male: "0201130120000010210",
      female: "0201130220000010210"
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

  async fetch95_99National(year) {
    console.log(`📡 全国95-99歳データを取得中 (${year}年)...`);
    
    const results = [];
    
    // 男性データ取得
    try {
      const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${this.correct95_99SeriesIds.male}&RegionCode=00000`;
      const response = await this.fetchRequest(url);
      
      if (response.GET_STATS?.RESULT?.status === "0") {
        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (dataObjects && Array.isArray(dataObjects)) {
          for (const obj of dataObjects) {
            const value = obj.VALUE;
            const timeCode = value['@time'];
            const dataYear = parseInt(timeCode.substring(0, 4));
            
            if (dataYear === year) {
              const rawValue = parseInt(value['$']);
              const processedValue = Math.round(rawValue / 1000);
              
              results.push({
                year: dataYear,
                prefecture: '全国',
                prefectureCode: '00000',
                ageGroup: '95-99',
                gender: 'male',
                population: processedValue
              });
              
              console.log(`  男性: ${rawValue.toLocaleString()}人 → ${processedValue}千人`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ 男性95-99歳取得エラー:`, error.message);
    }
    
    // 女性データ取得
    try {
      const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${this.correct95_99SeriesIds.female}&RegionCode=00000`;
      const response = await this.fetchRequest(url);
      
      if (response.GET_STATS?.RESULT?.status === "0") {
        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (dataObjects && Array.isArray(dataObjects)) {
          for (const obj of dataObjects) {
            const value = obj.VALUE;
            const timeCode = value['@time'];
            const dataYear = parseInt(timeCode.substring(0, 4));
            
            if (dataYear === year) {
              const rawValue = parseInt(value['$']);
              const processedValue = Math.round(rawValue / 1000);
              
              results.push({
                year: dataYear,
                prefecture: '全国',
                prefectureCode: '00000',
                ageGroup: '95-99',
                gender: 'female',
                population: processedValue
              });
              
              console.log(`  女性: ${rawValue.toLocaleString()}人 → ${processedValue}千人`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ 女性95-99歳取得エラー:`, error.message);
    }
    
    return results;
  }

  async fixAllNationalData() {
    console.log('🔧 全国データに95-99歳を追加中...\n');
    
    for (const year of this.years) {
      try {
        // 既存の全国データを読み込み
        const nationalFile = path.join(this.outputDir, `population_national_${year}.json`);
        let existingData = [];
        
        if (fs.existsSync(nationalFile)) {
          existingData = JSON.parse(fs.readFileSync(nationalFile, 'utf8'));
        }
        
        // 95-99歳データが既に存在するかチェック
        const has95_99 = existingData.some(d => d.ageGroup === '95-99');
        
        if (has95_99) {
          console.log(`✅ ${year}年: 95-99歳データは既に存在`);
          continue;
        }
        
        // 95-99歳データを取得
        const new95_99Data = await this.fetch95_99National(year);
        
        if (new95_99Data.length > 0) {
          // 既存データに追加
          const updatedData = [...existingData, ...new95_99Data];
          
          // 年齢順にソート
          updatedData.sort((a, b) => {
            const ageA = parseInt(a.ageGroup.split('-')[0]);
            const ageB = parseInt(b.ageGroup.split('-')[0]);
            if (ageA !== ageB) return ageA - ageB;
            return a.gender === 'male' ? -1 : 1;
          });
          
          // ファイルに保存
          fs.writeFileSync(nationalFile, JSON.stringify(updatedData, null, 2));
          
          const fileSize = Math.round(fs.statSync(nationalFile).size / 1024);
          console.log(`✅ ${year}年データ更新完了: ${updatedData.length}レコード (${fileSize}KB)`);
        } else {
          console.log(`❌ ${year}年: 95-99歳データの取得に失敗`);
        }
        
      } catch (error) {
        console.error(`❌ ${year}年データ処理エラー:`, error.message);
      }
      
      console.log(''); // 改行
    }
    
    console.log('🎉 95-99歳データの追加完了！');
    this.generateSummaryReport();
  }

  generateSummaryReport() {
    console.log('\n📊 === 更新後データ確認 ===');
    
    // 2025年データで確認
    try {
      const data2025 = JSON.parse(fs.readFileSync(
        path.join(this.outputDir, 'population_national_2025.json'), 'utf8'
      ));
      
      const ageGroups = [...new Set(data2025.map(d => d.ageGroup))].sort((a, b) => {
        const aStart = parseInt(a.split('-')[0]);
        const bStart = parseInt(b.split('-')[0]);
        return aStart - bStart;
      });
      
      console.log('更新後の年齢階級:');
      ageGroups.forEach((age, index) => {
        const count = data2025.filter(d => d.ageGroup === age).length;
        console.log(`  ${index + 1}. ${age}歳 (${count}レコード)`);
      });
      
      const has95_99 = ageGroups.includes('95-99');
      console.log(`\n95-99歳データ: ${has95_99 ? '✅存在' : '❌欠損'}`);
      
      if (has95_99) {
        const data95_99 = data2025.filter(d => d.ageGroup === '95-99');
        const total = data95_99.reduce((sum, d) => sum + d.population, 0);
        console.log(`95-99歳合計: ${total}千人 (${data95_99.map(d => `${d.gender}:${d.population}`).join(', ')})`);
      }
      
      console.log(`\n📊 総レコード数: ${data2025.length} (期待値: 40)`);
      
    } catch (error) {
      console.error('確認レポート生成エラー:', error.message);
    }
  }
}

// 実行
async function main() {
  try {
    const fixer = new Fix95_99Data();
    await fixer.fixAllNationalData();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();