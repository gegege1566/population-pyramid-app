// 正しいAPIキーを使用してデータを取得するスクリプト
const https = require('https');
const fs = require('fs');
const path = require('path');

class CorrectDataFetcher {
  constructor() {
    this.appId = 'a6c99af05ea1a0ebd7cc02e3b90b8f7c8408a430';
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.outputDir = path.join(__dirname, 'public/data/population');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
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

  async testApiConnection() {
    console.log('🔌 API接続テスト中...\n');
    
    try {
      const params = {
        appId: this.appId,
        statsDataId: '0003448237', // 将来推計人口
        metaGetFlg: 'Y',
        cntGetFlg: 'N',
        sectionHeaderFlg: '2'
      };
      
      const response = await this.apiRequest(params);
      
      console.log('📥 APIレスポンス:');
      console.log('Status:', response.GET_STATS_DATA?.RESULT?.STATUS);
      console.log('Error Message:', response.GET_STATS_DATA?.RESULT?.ERROR_MSG);
      
      if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
        console.log('✅ API接続成功！');
        return true;
      } else {
        console.log('❌ API接続失敗');
        return false;
      }
      
    } catch (error) {
      console.error('❌ API接続エラー:', error.message);
      return false;
    }
  }

  async fetchHokkaidoData() {
    console.log('\n🗾 北海道の2025年と2030年データを取得中...\n');
    
    const results = {};
    
    for (const year of [2025, 2030]) {
      console.log(`📅 ${year}年のデータ取得中...`);
      
      try {
        // 統計表IDを確認 - 将来推計人口データ
        const params = {
          appId: this.appId,
          statsDataId: '0003412049', // 日本の将来推計人口（都道府県別推計）
          cdArea: '01000', // 北海道
          cdTime: year.toString(),
          metaGetFlg: 'N',
          cntGetFlg: 'N',
          sectionHeaderFlg: '2'
        };
        
        const response = await this.apiRequest(params);
        
        if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
          console.log(`  ✅ ${year}年データ取得成功`);
          
          // データを解析して表示
          const values = response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
          console.log(`  📊 取得データ数: ${values.length}件`);
          
          // 40-44歳データを検索
          const age40_44Data = values.filter(item => {
            return item['@cat01'] && item['@cat01'].includes('40') || 
                   item['@indicator'] && item['@indicator'].includes('40');
          });
          
          console.log(`  🔍 40-44歳関連データ: ${age40_44Data.length}件`);
          age40_44Data.forEach((item, index) => {
            if (index < 5) { // 最初の5件のみ表示
              console.log(`    データ${index + 1}:`, {
                indicator: item['@indicator'],
                cat01: item['@cat01'],
                cat02: item['@cat02'],
                time: item['@time'],
                value: item['$']
              });
            }
          });
          
          results[year] = values;
          
        } else {
          console.log(`  ❌ ${year}年データ取得失敗:`, response.GET_STATS_DATA?.RESULT?.ERROR_MSG);
          
          // 別の統計表IDを試す
          console.log(`  🔄 別の統計表で再試行中...`);
          
          const altParams = {
            appId: this.appId,
            statsDataId: '0003448237', // 別の将来推計人口統計表
            cdCat01: '00001', // 北海道
            cdCat02: year.toString(),
            metaGetFlg: 'N',
            cntGetFlg: 'N'
          };
          
          const altResponse = await this.apiRequest(altParams);
          console.log(`  📥 代替API結果:`, altResponse.GET_STATS_DATA?.RESULT?.STATUS);
        }
        
        // API制限を避けるため待機
        await this.delay(2000);
        
      } catch (error) {
        console.error(`  ❌ ${year}年データ取得エラー:`, error.message);
      }
    }
    
    return results;
  }

  async run() {
    console.log('🚀 正確なデータ取得を開始...\n');
    
    // 1. API接続テスト
    const connectionOk = await this.testApiConnection();
    if (!connectionOk) {
      console.log('❌ API接続に失敗しました。処理を中断します。');
      return;
    }
    
    // 2. 北海道データ取得
    const data = await this.fetchHokkaidoData();
    
    console.log('\n🎉 データ取得処理完了');
  }
}

// 実行
const fetcher = new CorrectDataFetcher();
fetcher.run();