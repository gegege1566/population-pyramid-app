import React, { useEffect, useState } from 'react';
import { CoopMemberData } from '../types/coopMember';
import { AgeGroupSpending, TotalSpendingEstimation, DEFAULT_AGE_GROUP_SPENDING } from '../types/coopSpending';
import { SpendingEstimationService } from '../services/spendingEstimationService';

interface SpendingEstimationProps {
  coopMemberData: CoopMemberData[] | undefined;
  year: number;
  prefecture: string;
  ageGroupSpending?: AgeGroupSpending[];
}

const SpendingEstimation: React.FC<SpendingEstimationProps> = ({
  coopMemberData,
  year,
  prefecture,
  ageGroupSpending = DEFAULT_AGE_GROUP_SPENDING
}) => {
  const [estimation, setEstimation] = useState<TotalSpendingEstimation | null>(null);

  useEffect(() => {
    if (coopMemberData && coopMemberData.length > 0) {
      const result = SpendingEstimationService.estimateTotalSpending(
        coopMemberData,
        ageGroupSpending,
        year
      );
      setEstimation(result);
    } else {
      setEstimation(null);
    }
  }, [coopMemberData, ageGroupSpending, year]);

  if (!estimation) {
    return null;
  }

  // 年齢層別構成比を計算
  const ageGroupShares = SpendingEstimationService.calculateAgeGroupShare(estimation);

  // 上位5つの年齢層を取得
  const topAgeGroups = Array.from(ageGroupShares.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        組合員利用金額推定
      </h3>

      {/* 総利用金額 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">
          {prefecture} ({year}年)
        </div>
        <div className="text-2xl font-bold text-blue-900">
          {estimation.totalAmount.toLocaleString('ja-JP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })} 百万円
        </div>
        <div className="text-sm text-gray-600 mt-1">
          年間総利用金額推定
        </div>
      </div>

      {/* 年齢層別上位構成 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          利用金額構成比（上位5年齢層）
        </h4>
        <div className="space-y-2">
          {topAgeGroups.map(([ageGroup, share]) => {
            const data = estimation.estimations.find(e => e.ageGroup === ageGroup);
            if (!data) return null;
            
            return (
              <div key={ageGroup} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">
                  {ageGroup}歳
                </div>
                <div className="flex-1 mx-2">
                  <div className="relative bg-gray-200 rounded-full h-4">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-700 w-16 text-right">
                  {share.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 w-24 text-right ml-2">
                  {data.totalSpending.toLocaleString('ja-JP', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}百万円
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細テーブル（折りたたみ可能） */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
          年齢層別詳細を表示
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  年齢層
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  組合員数
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  年間利用額
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  総利用額
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  構成比
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {estimation.estimations.map((est, index) => {
                const share = ageGroupShares.get(est.ageGroup) || 0;
                return (
                  <tr key={est.ageGroup} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-900">
                      {est.ageGroup}歳
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {est.memberCount.toLocaleString()}千人
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {est.annualSpending.toLocaleString()}円
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 font-medium">
                      {est.totalSpending.toLocaleString('ja-JP', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}百万円
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {share.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-3 py-2 font-bold text-gray-900">
                  合計
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">
                  {estimation.estimations.reduce((sum, e) => sum + e.memberCount, 0).toLocaleString()}千人
                </td>
                <td className="px-3 py-2">
                  {/* 平均値は意味がないので空欄 */}
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">
                  {estimation.totalAmount.toLocaleString('ja-JP', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}百万円
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>

      <div className="mt-4 text-xs text-gray-500">
        ※ 組合員一人あたりの年間利用金額は推定値です
      </div>
    </div>
  );
};

export default SpendingEstimation;