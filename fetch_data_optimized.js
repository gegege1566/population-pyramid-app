#!/usr/bin/env node

// 最適化されたe-Stat Dashboard API データ取得スクリプト
const https = require('https');
const fs = require('fs');
const path = require('path');

class OptimizedEStatFetcher {
    constructor() {
        this.baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';
        this.requestDelay = 3000; // 3秒間隔（保守的な設定）
        this.retryDelay = 10000; // リトライ時は10秒待機
        this.maxRetries = 3;
        
        // 都道府県コード
        this.prefectureCodes = {
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

        // 年齢階級別系列ID（95+以上は除外 - APIエラーが発生するため）
        this.maleSeriesIds = [
            "0201130120000010010", "0201130120000010020", "0201130120000010030", "0201130120000010040",
            "0201130120000010050", "0201130120000010060", "0201130120000010070", "0201130120000010080",
            "0201130120000010090", "0201130120000010100", "0201130120000010110", "0201130120000010120",
            "0201130120000010130", "0201130120000010140", "0201130120000010150", "0201130120000010160",
            "0201130120000010170", "0201130120000010180", "0201130120000010200"
            // "0201130120000010205" // 95+以上は除外
        ];

        this.femaleSeriesIds = [
            "0201130220000010010", "0201130220000010020", "0201130220000010030", "0201130220000010040",
            "0201130220000010050", "0201130220000010060", "0201130220000010070", "0201130220000010080",
            "0201130220000010090", "0201130220000010100", "0201130220000010110", "0201130220000010120",
            "0201130220000010130", "0201130220000010140", "0201130220000010150", "0201130220000010160",
            "0201130220000010170", "0201130220000010180", "0201130220000010200"
            // "0201130220000010205" // 95+以上は除外
        ];

        // 系列IDから年齢階級への変換
        this.seriesToAge = {
            "0201130120000010010": "0-4", "0201130120000010020": "5-9", "0201130120000010030": "10-14",
            "0201130120000010040": "15-19", "0201130120000010050": "20-24", "0201130120000010060": "25-29",
            "0201130120000010070": "30-34", "0201130120000010080": "35-39", "0201130120000010090": "40-44",
            "0201130120000010100": "45-49", "0201130120000010110": "50-54", "0201130120000010120": "55-59",
            "0201130120000010130": "60-64", "0201130120000010140": "65-69", "0201130120000010150": "70-74",
            "0201130120000010160": "75-79", "0201130120000010170": "80-84", "0201130120000010180": "85-89",
            "0201130120000010200": "90-94",
            "0201130220000010010": "0-4", "0201130220000010020": "5-9", "0201130220000010030": "10-14",
            "0201130220000010040": "15-19", "0201130220000010050": "20-24", "0201130220000010060": "25-29",
            "0201130220000010070": "30-34", "0201130220000010080": "35-39", "0201130220000010090": "40-44",
            "0201130220000010100": "45-49", "0201130220000010110": "50-54", "0201130220000010120": "55-59",
            "0201130220000010130": "60-64", "0201130220000010140": "65-69", "0201130220000010150": "70-74",
            "0201130220000010160": "75-79", "0201130220000010170": "80-84", "0201130220000010180": "85-89",
            "0201130220000010200": "90-94"
        };
    }

    // HTTPSリクエスト（Promise版）
    httpsRequest(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        // レスポンスがHTMLの場合（エラーページ）
                        if (!response.headers['content-type']?.includes('application/json')) {
                            reject(new Error('HTML_RESPONSE'));
                            return;
                        }
                        
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    // 待機処理
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 都道府県データを取得（男女まとめて一度にリクエスト）
    async fetchPrefectureData(prefCode, prefInfo, retryCount = 0) {
        try {
            console.log(`📊 ${prefInfo.name} (${prefCode}) のデータを取得中...`);
            
            // 男女の系列IDを結合
            const allSeriesIds = [...this.maleSeriesIds, ...this.femaleSeriesIds];
            const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${allSeriesIds.join(',')}&RegionCode=${prefInfo.code}`;
            
            console.log(`  🌐 リクエスト送信中... (${allSeriesIds.length}系列)`);
            
            const response = await this.httpsRequest(url);
            
            // APIエラーチェック
            if (response.GET_STATS?.RESULT?.status !== "0") {
                const errorMsg = response.GET_STATS?.RESULT?.errorMsg || 'Unknown error';
                console.error(`  ❌ APIエラー: ${errorMsg}`);
                
                if (retryCount < this.maxRetries) {
                    console.log(`  🔄 リトライ中... (${retryCount + 1}/${this.maxRetries})`);
                    await this.delay(this.retryDelay);
                    return await this.fetchPrefectureData(prefCode, prefInfo, retryCount + 1);
                }
                
                return null;
            }
            
            const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
            if (!dataObjects || !Array.isArray(dataObjects)) {
                console.error(`  ❌ データが見つかりません`);
                return null;
            }
            
            console.log(`  ✅ APIレスポンス受信: ${dataObjects.length}件`);
            
            // データ変換
            const populationData = [];
            
            dataObjects.forEach(obj => {
                const value = obj.VALUE;
                const seriesId = value['@indicator'];
                const timeCode = value['@time']; // 例: "2025CY00"
                const population = parseInt(value['$']); // 千人単位
                
                // 年度抽出
                const year = parseInt(timeCode.substring(0, 4));
                
                // 性別と年齢階級を判定
                const gender = seriesId.startsWith('02011301') ? 'male' : 'female';
                const ageGroup = this.seriesToAge[seriesId];
                
                if (ageGroup) {
                    populationData.push({
                        year,
                        prefecture: prefInfo.name,
                        prefectureCode: prefCode,
                        ageGroup,
                        gender,
                        population
                    });
                }
            });
            
            console.log(`  ✅ ${prefInfo.name}: ${populationData.length}件のデータを処理完了`);
            
            // レート制限対応の待機
            await this.delay(this.requestDelay);
            
            return populationData;
            
        } catch (error) {
            if (error.message === 'HTML_RESPONSE') {
                console.error(`  ❌ ${prefInfo.name}: HTMLレスポンス（アクセス制限の可能性）`);
            } else {
                console.error(`  ❌ ${prefInfo.name}: ${error.message}`);
            }
            
            if (retryCount < this.maxRetries) {
                console.log(`  🔄 リトライ中... (${retryCount + 1}/${this.maxRetries})`);
                await this.delay(this.retryDelay);
                return await this.fetchPrefectureData(prefCode, prefInfo, retryCount + 1);
            }
            
            return null;
        }
    }

    // 全国データを取得
    async fetchNationalData() {
        try {
            console.log('🌏 全国データを取得中...');
            
            const allSeriesIds = [...this.maleSeriesIds, ...this.femaleSeriesIds];
            const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${allSeriesIds.join(',')}&RegionCode=00000`;
            
            const response = await this.httpsRequest(url);
            
            if (response.GET_STATS?.RESULT?.status !== "0") {
                throw new Error(response.GET_STATS?.RESULT?.errorMsg || 'API Error');
            }
            
            const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ || [];
            console.log(`  ✅ 全国データ: ${dataObjects.length}件を取得`);
            
            const populationData = [];
            
            dataObjects.forEach(obj => {
                const value = obj.VALUE;
                const seriesId = value['@indicator'];
                const timeCode = value['@time'];
                const population = Math.round(parseInt(value['$']) / 1000); // 千人単位に変換
                
                const year = parseInt(timeCode.substring(0, 4));
                const gender = seriesId.startsWith('02011301') ? 'male' : 'female';
                const ageGroup = this.seriesToAge[seriesId];
                
                if (ageGroup) {
                    populationData.push({
                        year,
                        prefecture: '全国',
                        prefectureCode: '00000',
                        ageGroup,
                        gender,
                        population
                    });
                }
            });
            
            await this.delay(this.requestDelay);
            return populationData;
            
        } catch (error) {
            console.error('❌ 全国データ取得エラー:', error.message);
            return null;
        }
    }

    // データをファイルに保存
    async saveData(data, filename) {
        const dataDir = path.join(__dirname, 'public/data/population');
        const filepath = path.join(dataDir, filename);
        
        // バックアップを作成
        if (fs.existsSync(filepath)) {
            const backupPath = `${filepath}.backup_${Date.now()}`;
            fs.copyFileSync(filepath, backupPath);
            console.log(`📋 バックアップ作成: ${path.basename(backupPath)}`);
        }
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`💾 保存完了: ${filename}`);
    }

    // メイン処理
    async run() {
        console.log('🚀 最適化版データ取得スクリプト開始');
        console.log(`⏱️  リクエスト間隔: ${this.requestDelay / 1000}秒`);
        console.log(`🔄 最大リトライ: ${this.maxRetries}回\n`);
        
        const years = [2025, 2030, 2035, 2040, 2045, 2050];
        
        // 1. 全国データの取得・保存
        for (const year of years) {
            console.log(`\n📅 ${year}年 全国データ取得...`);
            const nationalData = await this.fetchNationalData();
            
            if (nationalData && nationalData.length > 0) {
                const yearData = nationalData.filter(d => d.year === year);
                await this.saveData(yearData, `population_national_${year}.json`);
                console.log(`✅ ${year}年全国データ保存完了: ${yearData.length}件`);
            } else {
                console.log(`❌ ${year}年全国データ取得失敗`);
            }
        }
        
        // 2. 都道府県データの取得・保存
        for (const year of years) {
            console.log(`\n📅 ${year}年 都道府県データ取得...`);
            const allPrefData = {};
            let successCount = 0;
            let errorCount = 0;
            
            for (const [prefCode, prefInfo] of Object.entries(this.prefectureCodes)) {
                const prefData = await this.fetchPrefectureData(prefCode, prefInfo);
                
                if (prefData && prefData.length > 0) {
                    const yearData = prefData.filter(d => d.year === year);
                    allPrefData[prefCode] = yearData;
                    successCount++;
                } else {
                    allPrefData[prefCode] = [];
                    errorCount++;
                }
            }
            
            await this.saveData(allPrefData, `population_${year}.json`);
            
            const totalRecords = Object.values(allPrefData).reduce((sum, data) => sum + data.length, 0);
            console.log(`✅ ${year}年都道府県データ保存完了`);
            console.log(`  📊 成功: ${successCount}都道府県、失敗: ${errorCount}都道府県`);
            console.log(`  📈 総データ件数: ${totalRecords}件`);
        }
        
        console.log('\n🎉 全データ取得・保存が完了しました！');
    }
}

// 実行
if (require.main === module) {
    const fetcher = new OptimizedEStatFetcher();
    fetcher.run().catch(error => {
        console.error('💥 実行中にエラーが発生しました:', error);
        process.exit(1);
    });
}

module.exports = OptimizedEStatFetcher;