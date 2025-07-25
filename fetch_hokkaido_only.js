// 北海道のみのデータを効率的に取得するスクリプト
const https = require('https');
const fs = require('fs');
const path = require('path');

class HokkaidoDataFetcher {
  constructor() {
    this.appId = 'a6c99af05ea1a0ebd7cc02e3b90b8f7c8408a430';
    this.baseUrl = 'https://api.e-stat.go.jp/rest/2.1/app/json/getStatsData';
    
    // 年齢階級別系列ID（男性・女性）
    this.ageSeries = {
      male: {
        "0201130120000010010": "0-4", "0201130120000010020": "5-9", "0201130120000010030": "10-14",
        "0201130120000010040": "15-19", "0201130120000010050": "20-24", "0201130120000010060": "25-29",
        "0201130120000010070": "30-34", "0201130120000010080": "35-39", "0201130120000010090": "40-44",
        "0201130120000010100": "45-49", "0201130120000010110": "50-54", "0201130120000010120": "55-59",
        "0201130120000010130": "60-64", "0201130120000010140": "65-69", "0201130120000010150": "70-74",
        "0201130120000010160": "75-79", "0201130120000010170": "80-84", "0201130120000010180": "85-89",
        "0201130120000010200": "90-94", "0201130120000010205": "95-99"
      },
      female: {
        "0201130220000010010": "0-4", "0201130220000010020": "5-9", "0201130220000010030": "10-14",
        "0201130220000010040": "15-19", "0201130220000010050": "20-24", "0201130220000010060": "25-29",
        "0201130220000010070": "30-34", "0201130220000010080": "35-39", "0201130220000010090": "40-44",
        "0201130220000010100": "45-49", "0201130220000010110": "50-54", "0201130220000010120": "55-59",
        "0201130220000010130": "60-64", "0201130220000010140": "65-69", "0201130220000010150": "70-74",
        "0201130220000010160": "75-79", "0201130220000010170": "80-84", "0201130220000010180": "85-89",
        "0201130220000010200": "90-94", "0201130220000010205": "95-99"
      }
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async apiRequest(params) {
    const url = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async fetchHokkaidoYear(year) {
    console.log(`📅 北海道${year}年データ取得中...`);
    const results = [];
    
    // 男性データ取得
    console.log('  👨 男性データ取得中...');
    for (const [seriesId, ageGroup] of Object.entries(this.ageSeries.male)) {
      try {
        const params = {
          appId: this.appId,
          statsDataId: '0003002462', // 将来推計人口統計表
          cdCat01: '01000', // 北海道
          cdTime: `${year}000000`, // 年次コード
          cdCat02: seriesId, // 年齢階級・性別系列ID
          metaGetFlg: 'N',
          cntGetFlg: 'N',
          sectionHeaderFlg: '2'
        };
        
        const response = await this.apiRequest(params);
        
        if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
          const values = response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
          if (values.length > 0) {
            const population = Math.round(parseFloat(values[0]['$']) / 1000); // 千人単位に変換
            results.push({
              year: year,
              prefecture: '北海道',
              prefectureCode: '01',
              ageGroup: ageGroup,
              gender: 'male',
              population: population
            });
            console.log(`    ✅ ${ageGroup}: ${population}千人`);
          }
        }
        
        await this.delay(200); // API制限対策
      } catch (error) {
        console.error(`    ❌ ${ageGroup}エラー:`, error.message);
      }
    }
    
    // 女性データ取得
    console.log('  👩 女性データ取得中...');
    for (const [seriesId, ageGroup] of Object.entries(this.ageSeries.female)) {
      try {
        const params = {
          appId: this.appId,
          statsDataId: '0003002462',
          cdCat01: '01000',
          cdTime: `${year}000000`,
          cdCat02: seriesId,
          metaGetFlg: 'N',
          cntGetFlg: 'N',
          sectionHeaderFlg: '2'
        };
        
        const response = await this.apiRequest(params);
        
        if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
          const values = response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
          if (values.length > 0) {
            const population = Math.round(parseFloat(values[0]['$']) / 1000);
            results.push({
              year: year,
              prefecture: '北海道',
              prefectureCode: '01',
              ageGroup: ageGroup,
              gender: 'female',
              population: population
            });
            console.log(`    ✅ ${ageGroup}: ${population}千人`);
          }
        }
        
        await this.delay(200);
      } catch (error) {
        console.error(`    ❌ ${ageGroup}エラー:`, error.message);
      }
    }
    
    return results;
  }

  async run() {
    console.log('🏔️ 北海道データの正確な取得を開始...\n');
    
    try {
      // 2025年と2030年のデータを取得
      const data2025 = await this.fetchHokkaidoYear(2025);
      const data2030 = await this.fetchHokkaidoYear(2030);
      
      // 40-44歳のデータを確認
      console.log('\n🔍 40-44歳データの確認:');
      
      const check40_44 = (data, year) => {
        const age40_44 = data.filter(d => d.ageGroup === '40-44');
        console.log(`${year}年:`);
        let total = 0;
        age40_44.forEach(d => {
          console.log(`  ${d.gender}: ${d.population}千人 (${(d.population * 1000).toLocaleString()}人)`);
          total += d.population;
        });
        console.log(`  合計: ${total}千人 (${(total * 1000).toLocaleString()}人)`);
        return total;
      };
      
      const total2025 = check40_44(data2025, 2025);
      const total2030 = check40_44(data2030, 2030);
      
      const change = total2030 - total2025;
      const changeRate = total2025 > 0 ? ((change / total2025) * 100) : 0;
      
      console.log(`\n📊 変化:`);
      console.log(`  絶対数: ${change > 0 ? '+' : ''}${change}千人`);
      console.log(`  変化率: ${changeRate > 0 ? '+' : ''}${changeRate.toFixed(2)}%`);
      
      // 組合員シェア率の再計算
      const coopMembers2025 = 146.2; // 現在の組合員数
      const newShareRate = total2025 > 0 ? (coopMembers2025 / total2025) * 100 : 0;
      
      console.log(`\n🔢 正しいシェア率計算:`);
      console.log(`  組合員数: ${coopMembers2025}千人`);
      console.log(`  人口: ${total2025}千人`);
      console.log(`  シェア率: ${newShareRate.toFixed(2)}%`);
      
      // ファイルに保存
      const outputDir = path.join(__dirname, 'corrected_data');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outputDir, 'hokkaido_2025_corrected.json'), 
        JSON.stringify(data2025, null, 2)
      );
      fs.writeFileSync(
        path.join(outputDir, 'hokkaido_2030_corrected.json'), 
        JSON.stringify(data2030, null, 2)
      );
      
      console.log(`\n✅ 修正されたデータを保存しました: ${outputDir}`);
      
    } catch (error) {
      console.error('❌ 処理エラー:', error.message);
    }
  }
}

// 実行
const fetcher = new HokkaidoDataFetcher();
fetcher.run();