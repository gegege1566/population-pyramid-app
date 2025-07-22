const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// 都道府県コードマップ（e-Stat API用 5桁コード）
const PREFECTURE_CODES = {
    '01': { code: '01000', name: '北海道' },
    '02': { code: '02000', name: '青森県' },
    '03': { code: '03000', name: '岩手県' },
    '04': { code: '04000', name: '宮城県' },
    '05': { code: '05000', name: '秋田県' },
    '06': { code: '06000', name: '山形県' },
    '07': { code: '07000', name: '福島県' },
    '08': { code: '08000', name: '茨城県' },
    '09': { code: '09000', name: '栃木県' },
    '10': { code: '10000', name: '群馬県' },
    '11': { code: '11000', name: '埼玉県' },
    '12': { code: '12000', name: '千葉県' },
    '13': { code: '13000', name: '東京都' },
    '14': { code: '14000', name: '神奈川県' },
    '15': { code: '15000', name: '新潟県' },
    '16': { code: '16000', name: '富山県' },
    '17': { code: '17000', name: '石川県' },
    '18': { code: '18000', name: '福井県' },
    '19': { code: '19000', name: '山梨県' },
    '20': { code: '20000', name: '長野県' },
    '21': { code: '21000', name: '岐阜県' },
    '22': { code: '22000', name: '静岡県' },
    '23': { code: '23000', name: '愛知県' },
    '24': { code: '24000', name: '三重県' },
    '25': { code: '25000', name: '滋賀県' },
    '26': { code: '26000', name: '京都府' },
    '27': { code: '27000', name: '大阪府' },
    '28': { code: '28000', name: '兵庫県' },
    '29': { code: '29000', name: '奈良県' },
    '30': { code: '30000', name: '和歌山県' },
    '31': { code: '31000', name: '鳥取県' },
    '32': { code: '32000', name: '島根県' },
    '33': { code: '33000', name: '岡山県' },
    '34': { code: '34000', name: '広島県' },
    '35': { code: '35000', name: '山口県' },
    '36': { code: '36000', name: '徳島県' },
    '37': { code: '37000', name: '香川県' },
    '38': { code: '38000', name: '愛媛県' },
    '39': { code: '39000', name: '高知県' },
    '40': { code: '40000', name: '福岡県' },
    '41': { code: '41000', name: '佐賀県' },
    '42': { code: '42000', name: '長崎県' },
    '43': { code: '43000', name: '熊本県' },
    '44': { code: '44000', name: '大分県' },
    '45': { code: '45000', name: '宮崎県' },
    '46': { code: '46000', name: '鹿児島県' },
    '47': { code: '47000', name: '沖縄県' }
};

// 年齢階級別系列ID
const AGE_SERIES = {
    male: {
        "0-4": "0201130120000010010",
        "5-9": "0201130120000010020",
        "10-14": "0201130120000010030",
        "15-19": "0201130120000010040",
        "20-24": "0201130120000010050",
        "25-29": "0201130120000010060",
        "30-34": "0201130120000010070",
        "35-39": "0201130120000010080",
        "40-44": "0201130120000010090",
        "45-49": "0201130120000010100",
        "50-54": "0201130120000010110",
        "55-59": "0201130120000010120",
        "60-64": "0201130120000010130",
        "65-69": "0201130120000010140",
        "70-74": "0201130120000010150",
        "75-79": "0201130120000010160",
        "80-84": "0201130120000010170",
        "85-89": "0201130120000010180",
        "90-94": "0201130120000010200",
        "95+": "0201130120000010205"
    },
    female: {
        "0-4": "0201130220000010010",
        "5-9": "0201130220000010020",
        "10-14": "0201130220000010030",
        "15-19": "0201130220000010040",
        "20-24": "0201130220000010050",
        "25-29": "0201130220000010060",
        "30-34": "0201130220000010070",
        "35-39": "0201130220000010080",
        "40-44": "0201130220000010090",
        "45-49": "0201130220000010100",
        "50-54": "0201130220000010110",
        "55-59": "0201130220000010120",
        "60-64": "0201130220000010130",
        "65-69": "0201130220000010140",
        "70-74": "0201130220000010150",
        "75-79": "0201130220000010160",
        "80-84": "0201130220000010170",
        "85-89": "0201130220000010180",
        "90-94": "0201130220000010200",
        "95+": "0201130220000010205"
    }
};

// 対象年度（5年刻み）
const TARGET_YEARS = [2025, 2030, 2035, 2040, 2045, 2050];

// APIエンドポイント
const BASE_URL = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';

/**
 * HTTPSリクエスト送信（Promise版）
 */
function httpsRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    console.error('JSON parse error:', error);
                    console.error('Response data:', data.substring(0, 200));
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * 都道府県の人口データを取得（男女両方）
 */
async function fetchPrefectureData(prefCode, prefInfo, retryCount = 0) {
    try {
        console.log(`取得中: ${prefInfo.name} (${prefCode})`);
        
        // 男性データの系列ID
        const maleSeriesIds = Object.values(AGE_SERIES.male).join(',');
        // 女性データの系列ID  
        const femaleSeriesIds = Object.values(AGE_SERIES.female).join(',');
        
        // 男女のデータを同時取得
        const allSeriesIds = maleSeriesIds + ',' + femaleSeriesIds;
        
        const url = `${BASE_URL}?Lang=JP&IndicatorCode=${allSeriesIds}&RegionCode=${prefInfo.code}`;
        
        console.log(`  API URL: ${url.substring(0, 100)}...`);
        
        const response = await httpsRequest(url);
        
        // エラーチェック
        if (response.GET_STATS?.RESULT?.status !== "0") {
            const errorMsg = response.GET_STATS?.RESULT?.errorMsg || 'Unknown error';
            console.error(`  ❌ API Error for ${prefInfo.name}: ${errorMsg}`);
            
            // リトライ処理（最大3回）
            if (retryCount < 3) {
                console.log(`  🔄 Retrying ${prefInfo.name} (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // 指数バックオフ
                return await fetchPrefectureData(prefCode, prefInfo, retryCount + 1);
            }
            
            return null;
        }
        
        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) {
            console.error(`  ❌ No data objects for ${prefInfo.name}`);
            return null;
        }
        
        console.log(`  ✅ ${prefInfo.name}: ${dataObjects.length}件のデータを取得`);
        
        // データを変換
        const populationData = [];
        
        dataObjects.forEach(obj => {
            const value = obj.VALUE;
            const seriesId = value['@indicator'];
            const timeCode = value['@time']; // 例: "2025CY00"
            const population = parseInt(value['$']) * 1000; // 千人単位を人単位に変換
            
            // 年度を抽出
            const year = parseInt(timeCode.substring(0, 4));
            if (!TARGET_YEARS.includes(year)) {
                return; // 対象年度以外はスキップ
            }
            
            // 性別と年齢階級を判定
            let gender, ageGroup;
            
            if (seriesId.startsWith('02011301')) { // 男性
                gender = 'male';
                ageGroup = findAgeGroupBySeriesId(seriesId, 'male');
            } else if (seriesId.startsWith('02011302')) { // 女性
                gender = 'female'; 
                ageGroup = findAgeGroupBySeriesId(seriesId, 'female');
            }
            
            if (gender && ageGroup) {
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
        
        // レート制限対応（2秒待機）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return populationData;
        
    } catch (error) {
        console.error(`  ❌ Error fetching data for ${prefInfo.name}:`, error.message);
        
        // リトライ処理
        if (retryCount < 3) {
            console.log(`  🔄 Retrying ${prefInfo.name} (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
            return await fetchPrefectureData(prefCode, prefInfo, retryCount + 1);
        }
        
        return null;
    }
}

/**
 * 系列IDから年齢階級を特定
 */
function findAgeGroupBySeriesId(seriesId, gender) {
    const ageSeriesMap = AGE_SERIES[gender];
    for (const [ageGroup, id] of Object.entries(ageSeriesMap)) {
        if (id === seriesId) {
            return ageGroup;
        }
    }
    return null;
}

/**
 * データを年度別ファイルに分割して保存
 */
async function saveDataByYear(allData) {
    const dataDir = path.join(__dirname, '..', 'src', 'data', 'population');
    
    // ディレクトリが存在しない場合は作成
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
    
    // 年度別にデータを分割
    const dataByYear = {};
    allData.forEach(item => {
        if (!dataByYear[item.year]) {
            dataByYear[item.year] = {};
        }
        if (!dataByYear[item.year][item.prefectureCode]) {
            dataByYear[item.year][item.prefectureCode] = [];
        }
        dataByYear[item.year][item.prefectureCode].push(item);
    });
    
    // 年度別ファイルとして保存
    for (const year of TARGET_YEARS) {
        const yearData = dataByYear[year] || {};
        const filePath = path.join(dataDir, `population_${year}.json`);
        
        await fs.writeFile(filePath, JSON.stringify(yearData, null, 2));
        console.log(`💾 ${year}年のデータを保存: ${filePath}`);
    }
    
    // 全データを統合ファイルとしても保存
    const allDataPath = path.join(dataDir, 'population_future.json');
    await fs.writeFile(allDataPath, JSON.stringify(dataByYear, null, 2));
    console.log(`💾 全データを保存: ${allDataPath}`);
}

/**
 * メイン処理
 */
async function main() {
    console.log('🚀 e-Stat APIからの将来推計人口データ取得を開始...');
    console.log(`📊 対象年度: ${TARGET_YEARS.join(', ')}`);
    console.log(`📍 対象都道府県: ${Object.keys(PREFECTURE_CODES).length}都道府県`);
    console.log('⏳ 処理には時間がかかります（約5-10分）...\n');
    
    const allData = [];
    let successCount = 0;
    let errorCount = 0;
    
    // 都道府県ごとにデータを取得
    for (const [prefCode, prefInfo] of Object.entries(PREFECTURE_CODES)) {
        try {
            const prefData = await fetchPrefectureData(prefCode, prefInfo);
            
            if (prefData && prefData.length > 0) {
                allData.push(...prefData);
                successCount++;
                console.log(`  ✅ ${prefInfo.name}: ${prefData.length}件のデータを取得完了`);
            } else {
                errorCount++;
                console.log(`  ❌ ${prefInfo.name}: データ取得に失敗`);
            }
            
        } catch (error) {
            errorCount++;
            console.error(`  💥 ${prefInfo.name}: 予期しないエラー -`, error.message);
        }
    }
    
    // 結果サマリー
    console.log('\\n📈 取得結果:');
    console.log(`✅ 成功: ${successCount}都道府県`);
    console.log(`❌ 失敗: ${errorCount}都道府県`);
    console.log(`📊 総データ件数: ${allData.length}件`);
    
    if (allData.length > 0) {
        // データの統計
        const dataByYear = {};
        allData.forEach(item => {
            dataByYear[item.year] = (dataByYear[item.year] || 0) + 1;
        });
        
        console.log('\\n📅 年度別データ件数:');
        TARGET_YEARS.forEach(year => {
            const count = dataByYear[year] || 0;
            console.log(`  ${year}年: ${count}件`);
        });
        
        // データを保存
        console.log('\\n💾 データを保存中...');
        await saveDataByYear(allData);
        
        console.log('\\n🎉 データ取得・保存が完了しました！');
        console.log('📁 保存場所: src/data/population/');
        console.log('📄 ファイル:');
        TARGET_YEARS.forEach(year => {
            console.log(`  - population_${year}.json`);
        });
        console.log('  - population_future.json (全データ統合)');
        
    } else {
        console.log('\\n❌ データが取得できませんでした。APIキーまたはネットワーク接続を確認してください。');
        process.exit(1);
    }
}

// スクリプト実行
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { fetchPrefectureData, PREFECTURE_CODES, AGE_SERIES, TARGET_YEARS };