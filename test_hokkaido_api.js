// 北海道の2025年と2030年のデータをAPIから取得してテスト
const https = require('https');

class HokkaidoApiTest {
  constructor() {
    this.appId = '4f90cef93d88af5e03db96ebbadbedafa59d8248';
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
  }

  async apiRequest(params) {
    const url = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
    console.log('🔗 API URL:', url);
    
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

  async testHokkaidoData() {
    console.log('🔍 北海道の2025年データをAPI取得テスト...\n');
    
    try {
      const params = {
        appId: this.appId,
        statsDataId: '0003448237', // 将来推計人口
        cdCat01: '00001', // 北海道
        cdCat02: '2025', // 2025年
        metaGetFlg: 'Y', // メタ情報も取得
        cntGetFlg: 'N',
        sectionHeaderFlg: '2'
      };
      
      console.log('📤 リクエストパラメータ:');
      console.log(JSON.stringify(params, null, 2));
      
      const response = await this.apiRequest(params);
      
      console.log('\n📥 APIレスポンス:');
      console.log('Status:', response.GET_STATS_DATA?.RESULT?.STATUS);
      console.log('Error Message:', response.GET_STATS_DATA?.RESULT?.ERROR_MSG);
      
      if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
        console.log('✅ API呼び出し成功！');
        
        // メタ情報の確認
        if (response.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF) {
          console.log('\n📋 利用可能なカテゴリ情報:');
          const classInf = response.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF;
          
          if (Array.isArray(classInf)) {
            classInf.forEach((cat, index) => {
              console.log(`Category ${index + 1} (${cat['@id']}): ${cat['@name']}`);
              if (cat.CLASS_OBJ) {
                console.log('  利用可能な値:');
                cat.CLASS_OBJ.forEach((obj, i) => {
                  if (i < 10) { // 最初の10個のみ表示
                    console.log(`    ${obj['@code']}: ${obj['@name']}`);
                  }
                });
                if (cat.CLASS_OBJ.length > 10) {
                  console.log(`    ... and ${cat.CLASS_OBJ.length - 10} more`);
                }
              }
            });
          }
        }
        
        // データ値の確認
        if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
          const values = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
          console.log(`\n📊 データ数: ${values.length}件`);
          
          // 40-44歳のデータを探す
          console.log('\n🔍 40-44歳関連のデータを検索中...');
          values.forEach((item, index) => {
            if (index < 20) { // 最初の20件を表示
              console.log(`データ${index + 1}:`, {
                cat01: item['@cat01'],
                cat02: item['@cat02'], 
                time: item['@time'],
                value: item['$']
              });
            }
          });
        }
        
      } else {
        console.log('❌ API呼び出し失敗');
        console.log('詳細:', JSON.stringify(response, null, 2));
      }
      
    } catch (error) {
      console.error('❌ エラー:', error.message);
    }
  }
}

// 実行
const tester = new HokkaidoApiTest();
tester.testHokkaidoData();