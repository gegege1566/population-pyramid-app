import { PopulationData } from '../types/population';
import { PREFECTURE_CODES } from '../data/prefectures';

const AGE_GROUPS = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
  '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79',
  '80-84', '85+'
];

// 基準人口（2020年の東京都をベースとした実数値、単位：千人）
const BASELINE_POPULATION = {
  '0-4': { male: 267000, female: 254000 },
  '5-9': { male: 272000, female: 260000 },
  '10-14': { male: 264000, female: 253000 },
  '15-19': { male: 280000, female: 266000 },
  '20-24': { male: 427000, female: 418000 },
  '25-29': { male: 498000, female: 491000 },
  '30-34': { male: 485000, female: 467000 },
  '35-39': { male: 515000, female: 507000 },
  '40-44': { male: 543000, female: 536000 },
  '45-49': { male: 599000, female: 592000 },
  '50-54': { male: 546000, female: 543000 },
  '55-59': { male: 461000, female: 463000 },
  '60-64': { male: 398000, female: 411000 },
  '65-69': { male: 374000, female: 401000 },
  '70-74': { male: 310000, female: 359000 },
  '75-79': { male: 211000, female: 269000 },
  '80-84': { male: 134000, female: 190000 },
  '85+': { male: 78000, female: 138000 }
};

// 都道府県人口規模係数（東京を1.0とした相対値）
const PREFECTURE_SCALE: { [key: string]: number } = {
  '01': 0.38, // 北海道
  '02': 0.092, // 青森県
  '03': 0.089, // 岩手県
  '04': 0.165, // 宮城県
  '05': 0.072, // 秋田県
  '06': 0.079, // 山形県
  '07': 0.135, // 福島県
  '08': 0.205, // 茨城県
  '09': 0.140, // 栃木県
  '10': 0.140, // 群馬県
  '11': 0.520, // 埼玉県
  '12': 0.445, // 千葉県
  '13': 1.000, // 東京都
  '14': 0.650, // 神奈川県
  '15': 0.162, // 新潟県
  '16': 0.076, // 富山県
  '17': 0.082, // 石川県
  '18': 0.055, // 福井県
  '19': 0.059, // 山梨県
  '20': 0.147, // 長野県
  '21': 0.142, // 岐阜県
  '22': 0.260, // 静岡県
  '23': 0.530, // 愛知県
  '24': 0.127, // 三重県
  '25': 0.101, // 滋賀県
  '26': 0.185, // 京都府
  '27': 0.624, // 大阪府
  '28': 0.391, // 兵庫県
  '29': 0.096, // 奈良県
  '30': 0.068, // 和歌山県
  '31': 0.040, // 鳥取県
  '32': 0.049, // 島根県
  '33': 0.135, // 岡山県
  '34': 0.200, // 広島県
  '35': 0.098, // 山口県
  '36': 0.054, // 徳島県
  '37': 0.069, // 香川県
  '38': 0.097, // 愛媛県
  '39': 0.051, // 高知県
  '40': 0.360, // 福岡県
  '41': 0.059, // 佐賀県
  '42': 0.097, // 長崎県
  '43': 0.126, // 熊本県
  '44': 0.083, // 大分県
  '45': 0.078, // 宮崎県
  '46': 0.117, // 鹿児島県
  '47': 0.103  // 沖縄県
};

/**
 * 年代に基づく人口変化係数を計算
 */
function getPopulationMultiplier(year: number, ageGroup: string): number {
  const baseYear = 2020;
  const yearDiff = year - baseYear;
  
  // 過去の人口変化（1950-2020）
  if (year < 2020) {
    const yearsBack = baseYear - year;
    
    // 高齢化の逆転：過去ほど若年層が多く、高齢層が少ない
    if (ageGroup === '0-4' || ageGroup === '5-9') {
      return 1.0 + (yearsBack * 0.02); // 過去ほど若年層多い
    } else if (ageGroup.includes('65') || ageGroup.includes('70') || 
               ageGroup.includes('75') || ageGroup.includes('80') || ageGroup === '85+') {
      return Math.max(0.3, 1.0 - (yearsBack * 0.03)); // 過去ほど高齢層少ない
    } else {
      return 1.0 + (yearsBack * 0.005); // 中年層は微増
    }
  }
  
  // 未来の人口変化（2025-2050）
  if (year > 2020) {
    const yearsForward = year - baseYear;
    
    // 少子高齢化の進行
    if (ageGroup === '0-4' || ageGroup === '5-9' || ageGroup === '10-14') {
      return Math.max(0.5, 1.0 - (yearsForward * 0.015)); // 少子化
    } else if (ageGroup.includes('65') || ageGroup.includes('70') || 
               ageGroup.includes('75') || ageGroup.includes('80') || ageGroup === '85+') {
      return 1.0 + (yearsForward * 0.025); // 高齢化
    } else {
      return Math.max(0.8, 1.0 - (yearsForward * 0.005)); // 人口減少
    }
  }
  
  return 1.0; // 2020年はベース
}

/**
 * 指定された都道府県・年度の人口ピラミッドデータを生成
 */
export function generatePopulationData(
  prefectureCode: string,
  year: number
): PopulationData[] {
  const data: PopulationData[] = [];
  const prefectureName = PREFECTURE_CODES[prefectureCode] || '不明';
  const scale = PREFECTURE_SCALE[prefectureCode] || 0.1;
  
  for (const ageGroup of AGE_GROUPS) {
    const baseline = BASELINE_POPULATION[ageGroup as keyof typeof BASELINE_POPULATION];
    const multiplier = getPopulationMultiplier(year, ageGroup);
    
    // ランダムな変動を追加（±5%）
    const randomVariation = 0.95 + (Math.random() * 0.1);
    
    const malePopulation = Math.round(
      baseline.male * scale * multiplier * randomVariation
    );
    const femalePopulation = Math.round(
      baseline.female * scale * multiplier * randomVariation
    );
    
    data.push(
      {
        year,
        prefecture: prefectureName,
        prefectureCode,
        ageGroup,
        gender: 'male',
        population: Math.max(1, malePopulation) // 最低1人
      },
      {
        year,
        prefecture: prefectureName,
        prefectureCode,
        ageGroup,
        gender: 'female',
        population: Math.max(1, femalePopulation) // 最低1人
      }
    );
  }
  
  return data;
}

/**
 * 1950-2050年の5年間隔データを生成
 */
export function generateHistoricalData(): { [year: number]: { [prefCode: string]: PopulationData[] } } {
  const result: { [year: number]: { [prefCode: string]: PopulationData[] } } = {};
  
  // 1950年から2050年まで5年刻み
  for (let year = 1950; year <= 2050; year += 5) {
    result[year] = {};
    
    // 全都道府県のデータを生成
    for (const prefCode of Object.keys(PREFECTURE_CODES)) {
      result[year][prefCode] = generatePopulationData(prefCode, year);
    }
  }
  
  return result;
}

/**
 * 利用可能な年度一覧を取得
 */
export function getAvailableYears(): number[] {
  const years: number[] = [];
  for (let year = 1950; year <= 2050; year += 5) {
    years.push(year);
  }
  return years;
}