import { PopulationData } from '../types/population';

interface ApiResponse {
  GET_STATS?: {
    RESULT?: {
      status: string;
      errorMsg?: string;
    };
    STATISTICAL_DATA?: {
      DATA_INF?: {
        DATA_OBJ?: Array<{
          VALUE: {
            '@indicator': string;
            '@time': string;
            '$': string;
          };
        }>;
      };
    };
  };
}

// 系列IDから年齢階級へのマッピング（男女統一）
const SERIES_TO_AGE: { [key: string]: string } = {
  // 男性
  "0201130120000010010": "0-4", "0201130120000010020": "5-9", "0201130120000010030": "10-14",
  "0201130120000010040": "15-19", "0201130120000010050": "20-24", "0201130120000010060": "25-29",
  "0201130120000010070": "30-34", "0201130120000010080": "35-39", "0201130120000010090": "40-44",
  "0201130120000010100": "45-49", "0201130120000010110": "50-54", "0201130120000010120": "55-59",
  "0201130120000010130": "60-64", "0201130120000010140": "65-69", "0201130120000010150": "70-74",
  "0201130120000010160": "75-79", "0201130120000010170": "80-84", "0201130120000010180": "85-89",
  "0201130120000010200": "90-94", "0201130120000010205": "95-99",
  // 女性
  "0201130220000010010": "0-4", "0201130220000010020": "5-9", "0201130220000010030": "10-14",
  "0201130220000010040": "15-19", "0201130220000010050": "20-24", "0201130220000010060": "25-29",
  "0201130220000010070": "30-34", "0201130220000010080": "35-39", "0201130220000010090": "40-44",
  "0201130220000010100": "45-49", "0201130220000010110": "50-54", "0201130220000010120": "55-59",
  "0201130220000010130": "60-64", "0201130220000010140": "65-69", "0201130220000010150": "70-74",
  "0201130220000010160": "75-79", "0201130220000010170": "80-84", "0201130220000010180": "85-89",
  "0201130220000010200": "90-94", "0201130220000010205": "95-99"
};

// 系列IDから性別を判定
const getGenderFromSeriesId = (seriesId: string): 'male' | 'female' => {
  return seriesId.includes('012000') ? 'male' : 'female';
};

// 都道府県コードマップ（2桁から5桁への変換）
const PREFECTURE_CODES: { [key: string]: { code: string; name: string } } = {
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

// 年齢階級別系列ID（バッチ処理用）
const ALL_SERIES_IDS = {
  male: [
    "0201130120000010010", "0201130120000010020", "0201130120000010030", "0201130120000010040", "0201130120000010050",
    "0201130120000010060", "0201130120000010070", "0201130120000010080", "0201130120000010090", "0201130120000010100",
    "0201130120000010110", "0201130120000010120", "0201130120000010130", "0201130120000010140", "0201130120000010150",
    "0201130120000010160", "0201130120000010170", "0201130120000010180", "0201130120000010200", "0201130120000010205"
  ],
  female: [
    "0201130220000010010", "0201130220000010020", "0201130220000010030", "0201130220000010040", "0201130220000010050",
    "0201130220000010060", "0201130220000010070", "0201130220000010080", "0201130220000010090", "0201130220000010100",
    "0201130220000010110", "0201130220000010120", "0201130220000010130", "0201130220000010140", "0201130220000010150",
    "0201130220000010160", "0201130220000010170", "0201130220000010180", "0201130220000010200", "0201130220000010205"
  ]
};

export class UnifiedEStatService {
  private cache = new Map<string, PopulationData[]>();
  private baseUrl = 'https://dashboard.e-stat.go.jp/api/1.0/Json/getData';

  private async fetchRequest(url: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async getPopulationData(prefCode: string, year: number): Promise<PopulationData[]> {
    // 日本全体の場合（prefCode = '00000'）
    if (prefCode === '00000') {
      return this.getNationalPopulationData(year);
    }
    const cacheKey = `${prefCode}-${year}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const prefInfo = PREFECTURE_CODES[prefCode];
      if (!prefInfo) {
        throw new Error(`Unknown prefecture code: ${prefCode}`);
      }

      const allData: PopulationData[] = [];

      // 男性データを取得
      for (const seriesId of ALL_SERIES_IDS.male) {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${prefInfo.code}`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue; // この系列IDのデータがない場合はスキップ
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time']; // 例: "2025CY00"
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = SERIES_TO_AGE[seriesId];
            if (ageGroup) {
              allData.push({
                year: dataYear,
                prefecture: prefInfo.name,
                prefectureCode: prefCode,
                ageGroup,
                gender: 'male',
                population: Math.round(parseInt(value['$']) / 1000) // 人単位から千人単位に変換
              });
            }
          }
        }

        // レート制限回避
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 女性データを取得
      for (const seriesId of ALL_SERIES_IDS.female) {
        const url = `${this.baseUrl}?Lang=JP&IndicatorCode=${seriesId}&RegionCode=${prefInfo.code}`;
        const response = await this.fetchRequest(url);

        if (response.GET_STATS?.RESULT?.status !== "0") {
          continue; // この系列IDのデータがない場合はスキップ
        }

        const dataObjects = response.GET_STATS?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ;
        if (!dataObjects || !Array.isArray(dataObjects)) continue;

        for (const obj of dataObjects) {
          const value = obj.VALUE;
          const timeCode = value['@time']; // 例: "2025CY00"
          const dataYear = parseInt(timeCode.substring(0, 4));
          
          if (dataYear === year) {
            const ageGroup = SERIES_TO_AGE[seriesId];
            if (ageGroup) {
              allData.push({
                year: dataYear,
                prefecture: prefInfo.name,
                prefectureCode: prefCode,
                ageGroup,
                gender: 'female',
                population: Math.round(parseInt(value['$']) / 1000) // 人単位から千人単位に変換
              });
            }
          }
        }

        // レート制限回避
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.cache.set(cacheKey, allData);
      return allData;

    } catch (error) {
      console.error(`API Error for ${prefCode}-${year}:`, error);
      throw error;
    }
  }

  async getAvailableYears(): Promise<number[]> {
    // ダッシュボードAPIで利用可能な年度を返す
    // 将来推計データのみ（5年刻み）
    return [2025, 2030, 2035, 2040, 2045, 2050];
  }

  clearCache(): void {
    this.cache.clear();
  }

  // 都道府県データを直接取得（日本全体集計用）
  private async fetchPrefectureDataDirect(prefCode: string, year: number): Promise<PopulationData[]> {
    const cacheKey = `${prefCode}-${year}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await this.getPopulationData(prefCode, year);
    this.cache.set(cacheKey, result);
    return result;
  }

  // 日本全体のデータを取得（全都道府県の合計）
  async getNationalPopulationData(year: number): Promise<PopulationData[]> {
    const cacheKey = `national-${year}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log(`Fetching national data for year ${year}...`);
      
      // 全都道府県のデータを並列取得
      const prefectureCodes = [
        '01000', '02000', '03000', '04000', '05000', '06000', '07000', '08000', 
        '09000', '10000', '11000', '12000', '13000', '14000', '15000', '16000',
        '17000', '18000', '19000', '20000', '21000', '22000', '23000', '24000',
        '25000', '26000', '27000', '28000', '29000', '30000', '31000', '32000',
        '33000', '34000', '35000', '36000', '37000', '38000', '39000', '40000',
        '41000', '42000', '43000', '44000', '45000', '46000', '47000'
      ];

      const promises = prefectureCodes.map(async (prefCode, index) => {
        try {
          // レート制限対策
          await new Promise(resolve => setTimeout(resolve, index * 50));
          // 既存のgetPopulationDataを直接呼ばないようにして無限ループを回避
          const data = await this.fetchPrefectureDataDirect(prefCode, year);
          return data;
        } catch (error) {
          console.warn(`Failed to fetch data for ${prefCode}:`, error);
          return [];
        }
      });

      const allPrefectureData = await Promise.all(promises);
      
      // 年齢グループ別に集計
      const nationalData: { [key: string]: { male: number, female: number } } = {};
      
      // 年齢グループを定義（0-4, 5-9, ..., 95-99, 100+）
      const ageGroups = [];
      for (let i = 0; i < 20; i++) {
        ageGroups.push(`${i * 5}-${i * 5 + 4}`);
      }
      ageGroups.push('100+');
      
      // 初期化
      ageGroups.forEach(ageGroup => {
        nationalData[ageGroup] = { male: 0, female: 0 };
      });

      // 全都道府県データを集計
      allPrefectureData.forEach(prefectureData => {
        prefectureData.forEach(record => {
          const ageGroup = record.ageGroup;
          if (nationalData[ageGroup]) {
            if (record.gender === 'male') {
              nationalData[ageGroup].male += record.population;
            } else {
              nationalData[ageGroup].female += record.population;
            }
          }
        });
      });

      // PopulationData形式に変換
      const result: PopulationData[] = [];
      ageGroups.forEach(ageGroup => {
        const data = nationalData[ageGroup];
        result.push({
          year,
          prefecture: '全国',
          prefectureCode: '00000',
          ageGroup: ageGroup,
          gender: 'male',
          population: data.male
        });
        result.push({
          year,
          prefecture: '全国',
          prefectureCode: '00000',
          ageGroup: ageGroup,
          gender: 'female',
          population: data.female
        });
      });

      this.cache.set(cacheKey, result);
      console.log(`✅ National data fetched for ${year}. Total records: ${result.length}`);
      
      return result;

    } catch (error) {
      console.error(`Failed to fetch national data for ${year}:`, error);
      throw error;
    }
  }
}