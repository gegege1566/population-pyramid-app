#!/usr/bin/env node

// e-Stat Dashboard API テスト用シンプルスクリプト
const https = require('https');

// API設定
const BASE_URL = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';

// テスト用データ：東京都の男性0-4歳人口（2025年）
const TEST_SERIES_ID = '0201130120000010010';
const TEST_REGION_CODE = '13000'; // 東京都

function testApiConnection() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}?Lang=JP&IndicatorCode=${TEST_SERIES_ID}&RegionCode=${TEST_REGION_CODE}`;
        
        console.log('🌐 API接続テスト開始...');
        console.log(`📊 URL: ${url}`);
        
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    console.log(`📡 ステータス: ${response.statusCode}`);
                    console.log(`📄 Content-Type: ${response.headers['content-type']}`);
                    
                    if (!response.headers['content-type']?.includes('application/json')) {
                        console.error('❌ JSON以外のレスポンス（HTMLエラーページ等）');
                        console.log('📄 レスポンス（先頭200文字）:');
                        console.log(data.substring(0, 200));
                        reject(new Error('Invalid response format'));
                        return;
                    }
                    
                    const parsed = JSON.parse(data);
                    
                    console.log('✅ JSON解析成功');
                    console.log(`📊 API結果: ${parsed?.GET_STATS?.RESULT?.status}`);
                    console.log(`📝 メッセージ: ${parsed?.GET_STATS?.RESULT?.errorMsg}`);
                    
                    if (parsed?.GET_STATS?.RESULT?.status === '0') {
                        const dataCount = parsed?.GET_STATS?.STATISTICAL_DATA?.RESULT_INF?.TOTAL_NUMBER;
                        console.log(`📈 データ件数: ${dataCount}`);
                        
                        if (parsed?.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ) {
                            const firstData = parsed.GET_STATS.STATISTICAL_DATA.DATA_INF.DATA_OBJ[0];
                            console.log('📊 サンプルデータ:');
                            console.log(`  系列ID: ${firstData?.VALUE?.['@indicator']}`);
                            console.log(`  地域コード: ${firstData?.VALUE?.['@regionCode']}`);
                            console.log(`  時点: ${firstData?.VALUE?.['@time']}`);
                            console.log(`  数値: ${firstData?.VALUE?.['$']}`);
                            console.log(`  単位: ${firstData?.VALUE?.['@unit']}`);
                        }
                        
                        console.log('✅ API接続・データ取得成功！');
                        resolve(parsed);
                    } else {
                        console.log('⚠️ データが見つかりません');
                        resolve(parsed);
                    }
                    
                } catch (error) {
                    console.error('❌ JSON解析エラー:', error.message);
                    console.log('📄 レスポンス（先頭500文字）:');
                    console.log(data.substring(0, 500));
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error('❌ ネットワークエラー:', error.message);
            reject(error);
        });
    });
}

// 複数系列のテスト
async function testMultipleSeries() {
    console.log('\n🔗 複数系列同時取得テスト...');
    
    // 東京都の男性0-4歳、5-9歳、女性0-4歳
    const seriesIds = ['0201130120000010010', '0201130120000010020', '0201130220000010010'];
    const url = `${BASE_URL}?Lang=JP&IndicatorCode=${seriesIds.join(',')}&RegionCode=13000`;
    
    console.log(`📊 URL: ${url}`);
    
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    if (!response.headers['content-type']?.includes('application/json')) {
                        console.error('❌ JSON以外のレスポンス');
                        reject(new Error('Invalid response format'));
                        return;
                    }
                    
                    const parsed = JSON.parse(data);
                    
                    if (parsed?.GET_STATS?.RESULT?.status === '0') {
                        const dataCount = parsed?.GET_STATS?.STATISTICAL_DATA?.RESULT_INF?.TOTAL_NUMBER;
                        console.log(`✅ 複数系列取得成功: ${dataCount}件`);
                        resolve(parsed);
                    } else {
                        console.log(`⚠️ ${parsed?.GET_STATS?.RESULT?.errorMsg}`);
                        resolve(parsed);
                    }
                    
                } catch (error) {
                    console.error('❌ 複数系列テスト失敗:', error.message);
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// 全国データのテスト
async function testNationalData() {
    console.log('\n🌏 全国データ取得テスト...');
    
    const url = `${BASE_URL}?Lang=JP&IndicatorCode=${TEST_SERIES_ID}&RegionCode=00000`;
    console.log(`📊 URL: ${url}`);
    
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    if (!response.headers['content-type']?.includes('application/json')) {
                        console.error('❌ JSON以外のレスポンス');
                        reject(new Error('Invalid response format'));
                        return;
                    }
                    
                    const parsed = JSON.parse(data);
                    
                    if (parsed?.GET_STATS?.RESULT?.status === '0') {
                        console.log('✅ 全国データ取得成功');
                        resolve(parsed);
                    } else {
                        console.log(`⚠️ ${parsed?.GET_STATS?.RESULT?.errorMsg}`);
                        resolve(parsed);
                    }
                    
                } catch (error) {
                    console.error('❌ 全国データテスト失敗:', error.message);
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// メイン実行
async function main() {
    console.log('🚀 e-Stat Dashboard API 接続テスト開始\n');
    
    try {
        // 1. 基本接続テスト
        await testApiConnection();
        
        // 2秒待機
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. 複数系列テスト
        await testMultipleSeries();
        
        // 2秒待機
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. 全国データテスト
        await testNationalData();
        
        console.log('\n🎉 すべてのテストが完了しました！');
        console.log('💡 APIが正常に動作している場合、データ取得スクリプトを実行できます。');
        
    } catch (error) {
        console.error('\n💥 テスト中にエラーが発生しました:', error.message);
        console.log('\n🔧 トラブルシューティング:');
        console.log('1. インターネット接続を確認');
        console.log('2. e-Stat APIサーバーの状況を確認');
        console.log('3. アクセス制限（Rate Limiting）の可能性');
        console.log('4. 一時的にAPIが利用できない可能性');
        process.exit(1);
    }
}

// 実行
main();