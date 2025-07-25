// 全データをAPIから再取得するスクリプト
const https = require('https');
const fs = require('fs');
const path = require('path');

class FullDataRefresh {
  constructor() {
    this.appId = '4f90cef93d88af5e03db96ebbadbedafa59d8248';
    this.baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
    this.outputDir = path.join(__dirname, 'public/data/population');
    
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    this.years = [2025, 2030, 2035, 2040, 2045, 2050];
    this.prefectureCodes = [];
    
    // 01から47まで生成
    for (let i = 1; i <= 47; i++) {
      this.prefectureCodes.push(i.toString().padStart(2, '0'));
    }
    
    // 年齢階級マッピング
    this.ageGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];
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

  async getPopulationDataForYear(year) {
    console.log(`\n🗓️ ${year}年のデータ取得を開始...`);
    
    const yearData = {};
    
    for (const prefCode of this.prefectureCodes) {
      try {
        console.log(`  📍 ${prefCode} (${this.getPrefectureName(prefCode)}) を処理中...`);
        
        const params = {
          appId: this.appId,
          statsDataId: '0003448237', // 将来推計人口
          cdCat01: prefCode.padStart(5, '0'), // 都道府県コード
          cdCat02: year.toString(), // 年次
          cdCat03: '1', // 総人口
          metaGetFlg: 'N',
          cntGetFlg: 'N',
          sectionHeaderFlg: '2'
        };
        
        const response = await this.apiRequest(params);
        
        if (response.GET_STATS_DATA?.RESULT?.STATUS === 0) {
          const transformedData = this.transformApiData(response, prefCode, year);
          yearData[prefCode] = transformedData;
          console.log(`    ✅ 成功: ${transformedData.length}件のデータ`);
        } else {
          console.log(`    ⚠️ スキップ: ${response.GET_STATS_DATA?.RESULT?.ERROR_MSG || 'データなし'}`);
          yearData[prefCode] = [];
        }
        
        // API制限を避けるため1秒待機
        await this.delay(1000);
        
      } catch (error) {
        console.error(`    ❌ エラー (${prefCode}):`, error.message);
        yearData[prefCode] = [];
      }
    }
    
    // ファイルに保存
    const outputFile = path.join(this.outputDir, `population_${year}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(yearData, null, 2));
    console.log(`✅ ${year}年データを保存: ${outputFile}`);
    
    return yearData;
  }

  transformApiData(response, prefCode, year) {
    const data = [];
    const values = response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    
    // データを年齢階級と性別で整理
    const grouped = {};
    
    values.forEach(item => {
      const value = parseFloat(item['$']) || 0;
      const ageCode = item['@cat01']; // 年齢階級コード
      const genderCode = item['@cat02']; // 性別コード
      
      // 年齢階級の変換
      const ageGroup = this.getAgeGroupFromCode(ageCode);
      const gender = genderCode === '1' ? 'male' : genderCode === '2' ? 'female' : null;
      
      if (ageGroup && gender) {
        const key = `${ageGroup}-${gender}`;
        grouped[key] = (grouped[key] || 0) + value;
      }
    });
    
    // 最終データ形式に変換
    Object.keys(grouped).forEach(key => {
      const [ageGroup, gender] = key.split('-');
      data.push({
        year: year,
        prefecture: this.getPrefectureName(prefCode),
        prefectureCode: prefCode,
        ageGroup: ageGroup,
        gender: gender,
        population: Math.round(grouped[key] / 1000) // 千人単位に変換
      });
    });
    
    return data;
  }

  getAgeGroupFromCode(code) {
    // e-Stat APIの年齢階級コードから年齢階級への変換
    const mapping = {
      '00001': '0-4', '00002': '5-9', '00003': '10-14', '00004': '15-19',
      '00005': '20-24', '00006': '25-29', '00007': '30-34', '00008': '35-39',
      '00009': '40-44', '00010': '45-49', '00011': '50-54', '00012': '55-59',
      '00013': '60-64', '00014': '65-69', '00015': '70-74', '00016': '75-79',
      '00017': '80-84', '00018': '85-89', '00019': '90-94', '00020': '95-99'
    };
    return mapping[code] || null;
  }

  getPrefectureName(prefCode) {
    const names = {
      '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
      '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
      '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
      '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
      '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
      '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
      '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
      '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
      '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
      '46': '鹿児島県', '47': '沖縄県'
    };
    return names[prefCode] || `未知(${prefCode})`;
  }

  async refreshAllData() {
    console.log('🚀 全データのAPI再取得を開始...\n');
    
    for (const year of this.years) {
      try {
        await this.getPopulationDataForYear(year);
      } catch (error) {
        console.error(`❌ ${year}年の処理でエラー:`, error.message);
      }
    }
    
    console.log('\n🎉 全データの再取得が完了しました！');
  }
}

// 実行
const refresher = new FullDataRefresh();
refresher.refreshAllData();