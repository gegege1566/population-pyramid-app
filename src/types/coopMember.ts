// 組合員数データの型定義

// 年齢階級別構成比データ
export interface AgeComposition {
  ageGroup: string;
  percentage: number;
  estimatedMembers: number;
}

// 都道府県別組合員数データ
export interface PrefectureCoopMembers {
  prefectureCode: string;
  prefectureName: string;
  totalMembers: number;
}

// 組合員数サービスのレスポンス型
export interface CoopMemberData {
  year: number;
  prefecture: string;
  prefectureCode: string;
  ageGroup: string;
  memberCount: number; // 千人単位
}

// 年齢構成比の設定
export interface AgeCompositionConfig {
  compositions: AgeComposition[];
  lastUpdated: string;
}