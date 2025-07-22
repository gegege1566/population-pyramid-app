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

// 年齢階級別系列ID - 小分けにしてURL長制限を回避
const AGE_SERIES_BATCHES = {
    male: [
        // バッチ1: 0-24歳
        ["0201130120000010010", "0201130120000010020", "0201130120000010030", "0201130120000010040", "0201130120000010050"],
        // バッチ2: 25-49歳
        ["0201130120000010060", "0201130120000010070", "0201130120000010080", "0201130120000010090", "0201130120000010100"],
        // バッチ3: 50-74歳
        ["0201130120000010110", "0201130120000010120", "0201130120000010130", "0201130120000010140", "0201130120000010150"],
        // バッチ4: 75歳以上
        ["0201130120000010160", "0201130120000010170", "0201130120000010180", "0201130120000010200", "0201130120000010205"]
    ],
    female: [
        // バッチ1: 0-24歳
        ["0201130220000010010", "0201130220000010020", "0201130220000010030", "0201130220000010040", "0201130220000010050"],
        // バッチ2: 25-49歳
        ["0201130220000010060", "0201130220000010070", "0201130220000010080", "0201130220000010090", "0201130220000010100"],
        // バッチ3: 50-74歳
        ["0201130220000010110", "0201130220000010120", "0201130220000010130", "0201130220000010140", "0201130220000010150"],
        // バッチ4: 75歳以上
        ["0201130220000010160", "0201130220000010170", "0201130220000010180", "0201130220000010200", "0201130220000010205"]
    ]
};

// 系列IDから年齢階級へのマッピング
const SERIES_TO_AGE = {
    "0201130120000010010": "0-4", "0201130220000010010": "0-4",
    "0201130120000010020": "5-9", "0201130220000010020": "5-9",
    "0201130120000010030": "10-14", "0201130220000010030": "10-14",
    "0201130120000010040": "15-19", "0201130220000010040": "15-19",
    "0201130120000010050": "20-24", "0201130220000010050": "20-24",
    "0201130120000010060": "25-29", "0201130220000010060": "25-29",
    "0201130120000010070": "30-34", "0201130220000010070": "30-34",
    "0201130120000010080": "35-39", "0201130220000010080": "35-39",
    "0201130120000010090": "40-44", "0201130220000010090": "40-44",
    "0201130120000010100": "45-49", "0201130220000010100": "45-49",
    "0201130120000010110": "50-54", "0201130220000010110": "50-54",
    "0201130120000010120": "55-59", "0201130220000010120": "55-59",
    "0201130120000010130": "60-64", "0201130220000010130": "60-64",
    "0201130120000010140": "65-69", "0201130220000010140": "65-69",
    "0201130120000010150": "70-74", "0201130220000010150": "70-74",
    "0201130120000010160": "75-79", "0201130220000010160": "75-79",
    "0201130120000010170": "80-84", "0201130220000010170": "80-84",
    "0201130120000010180": "85-89", "0201130220000010180": "85-89",
    "0201130120000010200": "90-94", "0201130220000010200": "90-94",
    "0201130120000010205": "95+", "0201130220000010205": "95+"
};

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
                    console.error('JSON parse error:', error.message);
                    console.error('Response preview:', data.substring(0, 200));
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * 1つのバッチでAPIリクエスト送信
 */
async function fetchBatch(prefCode, prefInfo, seriesIds, gender, batchIndex) {
    try {
        const seriesIdString = seriesIds.join(',');
        const url = `${BASE_URL}?Lang=JP&IndicatorCode=${seriesIdString}&RegionCode=${prefInfo.code}`;
        
        console.log(`  Batch ${batchIndex + 1}/${AGE_SERIES_BATCHES[gender].length} (${gender})`);
        
        const response = await httpsRequest(url);
        
        // エラーチェック
        if (response.GET_STATS?.RESULT?.status !== "0") {
            const errorMsg = response.GET_STATS?.RESULT?.errorMsg || 'Unknown error';
            console.error(`    ❌ API Error: ${errorMsg}`);
            return [];
        }
        
        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) {
            console.error(`    ❌ No data objects`);
            return [];
        }
        
        // データを変換
        const populationData = [];
        
        dataObjects.forEach(obj => {
            const value = obj.VALUE;
            const seriesId = value['@indicator'];
            const timeCode = value['@time']; // 例: "2025CY00"
            const population = Math.round(parseInt(value['$']) / 1000); // 人単位から千人単位に変換
            
            // 年度を抽出
            const year = parseInt(timeCode.substring(0, 4));
            
            // 年齢階級を特定
            const ageGroup = SERIES_TO_AGE[seriesId];
            if (!ageGroup) {
                console.warn(`    ⚠ Unknown series ID: ${seriesId}`);
                return;
            }
            
            populationData.push({
                year,
                prefecture: prefInfo.name,
                prefectureCode: prefCode,
                ageGroup,
                gender,
                population
            });
        });
        
        console.log(`    ✅ ${populationData.length}件のデータを取得`);
        return populationData;
        
    } catch (error) {
        console.error(`    ❌ Batch error:`, error.message);
        return [];
    }
}

/**
 * 都道府県の人口データを取得（バッチ処理版）
 */
async function fetchPrefectureData(prefCode, prefInfo) {
    try {
        console.log(`\\n📍 取得中: ${prefInfo.name} (${prefCode})`);
        
        const allData = [];
        
        // 男性データを取得
        console.log('  👨 男性データ取得中...');
        for (let i = 0; i < AGE_SERIES_BATCHES.male.length; i++) {
            const batchData = await fetchBatch(prefCode, prefInfo, AGE_SERIES_BATCHES.male[i], 'male', i);
            allData.push(...batchData);
            
            // API制限回避のため少し待機
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 女性データを取得
        console.log('  👩 女性データ取得中...');
        for (let i = 0; i < AGE_SERIES_BATCHES.female.length; i++) {
            const batchData = await fetchBatch(prefCode, prefInfo, AGE_SERIES_BATCHES.female[i], 'female', i);
            allData.push(...batchData);
            
            // API制限回避のため少し待機
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`  ✅ ${prefInfo.name}: 合計${allData.length}件のデータを取得完了`);
        return allData;
        
    } catch (error) {
        console.error(`  💥 ${prefInfo.name}: 予期しないエラー -`, error.message);
        return null;
    }
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
    const availableYears = Object.keys(dataByYear).sort();
    console.log('\\n💾 データを年度別に保存中...');
    
    for (const year of availableYears) {
        const yearData = dataByYear[year];
        const filePath = path.join(dataDir, `population_${year}.json`);
        
        await fs.writeFile(filePath, JSON.stringify(yearData, null, 2));
        console.log(`  📄 ${year}年: ${filePath}`);
    }
    
    // 全データを統合ファイルとしても保存
    const allDataPath = path.join(dataDir, 'population_future_all.json');
    await fs.writeFile(allDataPath, JSON.stringify(dataByYear, null, 2));
    console.log(`  📄 全統合: ${allDataPath}`);
    
    return availableYears;
}

/**
 * メイン処理
 */
async function main() {
    const startTime = Date.now();
    
    console.log('🚀 e-Stat APIからの将来推計人口データ取得を開始...');
    console.log('📊 対象: 2025-2070年 (5年刻み)');
    console.log(`📍 対象都道府県: ${Object.keys(PREFECTURE_CODES).length}都道府県`);
    console.log('⚙️ バッチ処理でURL制限を回避');
    console.log('⏳ 処理には時間がかかります（約10-15分）...\\n');
    
    const allData = [];
    let successCount = 0;
    let errorCount = 0;
    
    // 都道府県ごとにデータを取得（全都道府県）
    // const testPrefectures = ['13', '27', '23']; // テスト用
    const allPrefectures = Object.keys(PREFECTURE_CODES);
    console.log(`🏠 全都道府県実行: ${allPrefectures.length}都道府県`);
    
    for (const prefCode of allPrefectures) {
        const prefInfo = PREFECTURE_CODES[prefCode];
        
        try {
            const prefData = await fetchPrefectureData(prefCode, prefInfo);
            
            if (prefData && prefData.length > 0) {
                allData.push(...prefData);
                successCount++;
            } else {
                errorCount++;
            }
            
            // 都道府県間で少し待機
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            errorCount++;
            console.error(`  💥 ${prefInfo.name}: 予期しないエラー -`, error.message);
        }
    }
    
    // 結果サマリー
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\\n📈 取得結果サマリー:');
    console.log(`⏱️ 処理時間: ${duration}秒`);
    console.log(`✅ 成功: ${successCount}都道府県`);
    console.log(`❌ 失敗: ${errorCount}都道府県`);
    console.log(`📊 総データ件数: ${allData.length}件`);
    
    if (allData.length > 0) {
        // データの統計
        const dataByYear = {};
        const dataByPref = {};
        
        allData.forEach(item => {
            dataByYear[item.year] = (dataByYear[item.year] || 0) + 1;
            dataByPref[item.prefecture] = (dataByPref[item.prefecture] || 0) + 1;
        });
        
        console.log('\\n📅 年度別データ件数:');
        Object.keys(dataByYear).sort().forEach(year => {
            console.log(`  ${year}年: ${dataByYear[year]}件`);
        });
        
        console.log('\\n🏘️ 都道府県別データ件数:');
        Object.entries(dataByPref).forEach(([pref, count]) => {
            console.log(`  ${pref}: ${count}件`);
        });
        
        // データを保存
        const availableYears = await saveDataByYear(allData);
        
        console.log('\\n🎉 データ取得・保存が完了しました！');
        console.log(`📁 保存場所: src/data/population/`);
        console.log(`📄 対象年度: ${availableYears.join(', ')}`);
        
        // 次のステップの案内
        console.log('\\n🔄 次のステップ:');
        console.log('1. 全都道府県データを取得する場合は、testPrefectures配列をコメントアウト');
        console.log('2. アプリのデータローダーを更新して新しい年度に対応');
        console.log('3. 年度選択UIを2025-2070年に対応するよう拡張');
        
    } else {
        console.log('\\n❌ データが取得できませんでした。');
        console.log('🔍 確認事項:');
        console.log('- ネットワーク接続');
        console.log('- e-Stat APIサービス状況');
        console.log('- 系列IDの正確性');
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

module.exports = { fetchPrefectureData, PREFECTURE_CODES, AGE_SERIES_BATCHES };