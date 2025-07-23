const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// 北海道専用のデータ取得スクリプト
class HokkaidoDataFetcher {
  constructor() {
    this.appId = process.env.ESTAT_APP_ID || 'YOUR_APP_ID_HERE';
    this.statsId = '0003411595'; // 将来推計人口統計ID
    this.prefCode = '01000'; // 北海道
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.outputDir = path.join(__dirname, '../public/data/population');
  }

  // API呼び出し
  async fetchData(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
              resolve(parsed.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE);
            } else {
              reject(new Error('データが見つかりません'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  // 年度別データ取得
  async fetchYearData(year) {
    console.log(`北海道の${year}年データを取得中...`);
    
    const results = {};
    
    // 男性データ取得
    const maleUrl = `${this.baseUrl}?appId=${this.appId}&lang=J&statsDataId=${this.statsId}&metaGetFlg=Y&cntGetFlg=N&explanationGetFlg=Y&annotationGetFlg=Y&sectionHeaderFlg=1&replaceSpChars=0&cdArea=${this.prefCode}&cdCat01=1&cdTime=${year}0101`;
    
    try {
      const maleData = await this.fetchData(maleUrl);
      console.log(`✅ 男性データ: ${maleData.length}件`);
      
      // 女性データ取得
      const femaleUrl = `${this.baseUrl}?appId=${this.appId}&lang=J&statsDataId=${this.statsId}&metaGetFlg=Y&cntGetFlg=N&explanationGetFlg=Y&annotationGetFlg=Y&sectionHeaderFlg=1&replaceSpChars=0&cdArea=${this.prefCode}&cdCat01=2&cdTime=${year}0101`;
      
      const femaleData = await this.fetchData(femaleUrl);
      console.log(`✅ 女性データ: ${femaleData.length}件`);
      
      // データを年齢階級別に整理
      const processedData = this.processData([...maleData, ...femaleData], year);
      
      return processedData;
      
    } catch (error) {
      console.error(`❌ ${year}年のデータ取得に失敗:`, error.message);
      throw error;
    }
  }

  // データ処理
  processData(rawData, year) {
    const ageGroups = {};
    
    rawData.forEach(item => {
      const ageCode = item['@cat02'];
      const gender = item['@cat01'] === '1' ? 'male' : 'female';
      const value = parseInt(item['$']) || 0;
      
      // 年齢階級マッピング
      const ageGroupMap = {
        '00100': '0-4', '00200': '5-9', '00300': '10-14', '00400': '15-19',
        '00500': '20-24', '00600': '25-29', '00700': '30-34', '00800': '35-39',
        '00900': '40-44', '01000': '45-49', '01100': '50-54', '01200': '55-59',
        '01300': '60-64', '01400': '65-69', '01500': '70-74', '01600': '75-79',
        '01700': '80-84', '01800': '85-89', '01900': '90-94', '02000': '95-99'
      };
      
      const ageGroup = ageGroupMap[ageCode];
      if (ageGroup) {
        if (!ageGroups[ageGroup]) {
          ageGroups[ageGroup] = { male: 0, female: 0 };
        }
        ageGroups[ageGroup][gender] = value;
      }
    });

    // 結果を配列形式に変換
    const result = [];
    Object.keys(ageGroups).forEach(ageGroup => {
      result.push({
        year: year,
        prefecture: '北海道',
        prefectureCode: '01',
        ageGroup: ageGroup,
        male: ageGroups[ageGroup].male,
        female: ageGroups[ageGroup].female,
        total: ageGroups[ageGroup].male + ageGroups[ageGroup].female
      });
    });

    return result;
  }

  // ファイル保存
  async saveData(year, data) {
    const filename = `population_01_${year}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ ${filename} を保存しました`);
  }

  // 全年度取得
  async fetchAllYears() {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    
    for (const year of years) {
      try {
        const data = await this.fetchYearData(year);
        await this.saveData(year, data);
        console.log(`✅ ${year}年完了\n`);
        
        // API制限回避のため1秒待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ ${year}年の処理に失敗:`, error.message);
      }
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const fetcher = new HokkaidoDataFetcher();
  
  console.log('🏔️ 北海道の人口データ取得を開始...\n');
  
  fetcher.fetchAllYears()
    .then(() => {
      console.log('🎉 北海道のデータ取得が完了しました！');
    })
    .catch(error => {
      console.error('❌ エラーが発生しました:', error.message);
    });
}

module.exports = HokkaidoDataFetcher;