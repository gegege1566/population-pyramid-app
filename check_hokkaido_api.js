// 北海道の40-44歳人口データをAPIから確認するスクリプト
const https = require('https');

class PopulationApiChecker {
  constructor() {
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.appId = '4f90cef93d88af5e03db96ebbadbedafa59d8248';
  }

  async getPopulationData(prefCode, year) {
    // 統計表ID（将来推計人口）
    const statsDataId = '0003448237'; // 将来推計人口統計表
    
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: statsDataId,
      cdCat01: prefCode.padStart(5, '0'), // 都道府県コード（5桁）
      cdCat02: year.toString(), // 年次
      cdCat03: '1', // 総人口
      metaGetFlg: 'N',
      cntGetFlg: 'N',
      sectionHeaderFlg: '2'
    });

    const url = `${this.baseUrl}?${params.toString()}`;
    
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

  async checkHokkaidoData() {
    console.log('🔍 北海道（01）の40-44歳人口データをe-Stat APIから取得中...\n');
    
    try {
      // まず2025年のデータを試す
      console.log('📅 2025年のデータ取得を試行中...');
      const result2025 = await this.getPopulationData('01', 2025);
      console.log('API Response Status:', result2025.GET_STATS_DATA?.RESULT?.STATUS);
      console.log('API Response:', JSON.stringify(result2025, null, 2));
      
    } catch (error) {
      console.error('❌ APIエラー:', error.message);
    }
  }
}

// 実行
const checker = new PopulationApiChecker();
checker.checkHokkaidoData();