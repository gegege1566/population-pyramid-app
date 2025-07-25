import { CoopMemberData } from '../types/coopMember';
import { AgeGroupSpending, SpendingEstimation, TotalSpendingEstimation } from '../types/coopSpending';

export class SpendingEstimationService {
  /**
   * 組合員データと年齢別利用金額から総利用金額を推定
   * @param coopMemberData 組合員データ（千人単位）
   * @param ageGroupSpending 年齢別年間利用金額
   * @param year 対象年
   * @returns 利用金額推定結果
   */
  static estimateTotalSpending(
    coopMemberData: CoopMemberData[],
    ageGroupSpending: AgeGroupSpending[],
    year: number
  ): TotalSpendingEstimation {
    const estimations: SpendingEstimation[] = [];
    let totalAmount = 0;

    // 年齢層ごとに計算
    ageGroupSpending.forEach(spending => {
      const memberData = coopMemberData.find(m => m.ageGroup === spending.ageGroup);
      
      if (memberData) {
        // 組合員数（千人） × 1000 × 年間利用金額（円） / 1,000,000 = 百万円
        const totalSpending = (memberData.memberCount * 1000 * spending.annualSpending) / 1000000;
        
        estimations.push({
          ageGroup: spending.ageGroup,
          memberCount: memberData.memberCount,
          annualSpending: spending.annualSpending,
          totalSpending: totalSpending
        });
        
        totalAmount += totalSpending;
      } else {
        // 組合員データがない場合は0として追加
        estimations.push({
          ageGroup: spending.ageGroup,
          memberCount: 0,
          annualSpending: spending.annualSpending,
          totalSpending: 0
        });
      }
    });

    return {
      year,
      estimations,
      totalAmount
    };
  }

  /**
   * 複数年の利用金額推定
   * @param coopMemberDataByYear 年別の組合員データ
   * @param ageGroupSpending 年齢別年間利用金額
   * @returns 年別の利用金額推定結果
   */
  static estimateMultiYearSpending(
    coopMemberDataByYear: Map<number, CoopMemberData[]>,
    ageGroupSpending: AgeGroupSpending[]
  ): TotalSpendingEstimation[] {
    const results: TotalSpendingEstimation[] = [];
    
    coopMemberDataByYear.forEach((data, year) => {
      results.push(this.estimateTotalSpending(data, ageGroupSpending, year));
    });
    
    return results.sort((a, b) => a.year - b.year);
  }

  /**
   * 利用金額の変化率を計算
   * @param estimation1 比較元の推定結果
   * @param estimation2 比較先の推定結果
   * @returns 変化率（%）
   */
  static calculateChangeRate(
    estimation1: TotalSpendingEstimation,
    estimation2: TotalSpendingEstimation
  ): number {
    if (estimation1.totalAmount === 0) return 0;
    return ((estimation2.totalAmount - estimation1.totalAmount) / estimation1.totalAmount) * 100;
  }

  /**
   * 年齢層別の構成比を計算
   * @param estimation 推定結果
   * @returns 年齢層別構成比
   */
  static calculateAgeGroupShare(estimation: TotalSpendingEstimation): Map<string, number> {
    const shares = new Map<string, number>();
    
    if (estimation.totalAmount === 0) return shares;
    
    estimation.estimations.forEach(e => {
      shares.set(e.ageGroup, (e.totalSpending / estimation.totalAmount) * 100);
    });
    
    return shares;
  }
}