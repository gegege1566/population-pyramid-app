// 組合員利用金額関連の型定義

export interface AgeGroupSpending {
  ageGroup: string;
  annualSpending: number; // 年間利用金額（円）
}

// デフォルトの年齢別利用金額データ
export const DEFAULT_AGE_GROUP_SPENDING: AgeGroupSpending[] = [
  { ageGroup: '0-4', annualSpending: 0 },
  { ageGroup: '5-9', annualSpending: 0 },
  { ageGroup: '10-14', annualSpending: 0 },
  { ageGroup: '15-19', annualSpending: 0 },
  { ageGroup: '20-24', annualSpending: 59520 },
  { ageGroup: '25-29', annualSpending: 59520 },
  { ageGroup: '30-34', annualSpending: 104160 },
  { ageGroup: '35-39', annualSpending: 104160 },
  { ageGroup: '40-44', annualSpending: 133920 },
  { ageGroup: '45-49', annualSpending: 133920 },
  { ageGroup: '50-54', annualSpending: 148800 },
  { ageGroup: '55-59', annualSpending: 148800 },
  { ageGroup: '60-64', annualSpending: 163680 },
  { ageGroup: '65-69', annualSpending: 163680 },
  { ageGroup: '70-74', annualSpending: 178560 },
  { ageGroup: '75-79', annualSpending: 178560 },
  { ageGroup: '80-84', annualSpending: 163680 },
  { ageGroup: '85-89', annualSpending: 163680 },
  { ageGroup: '90-94', annualSpending: 104160 },
  { ageGroup: '95-99', annualSpending: 104160 },
];

// 利用金額推定結果
export interface SpendingEstimation {
  ageGroup: string;
  memberCount: number; // 組合員数（千人）
  annualSpending: number; // 年間利用金額（円/人）
  totalSpending: number; // 年齢層別総利用金額（百万円）
}

export interface TotalSpendingEstimation {
  year: number;
  estimations: SpendingEstimation[];
  totalAmount: number; // 全体の総利用金額（百万円）
}