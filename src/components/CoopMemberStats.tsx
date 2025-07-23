import React from 'react';
import { CoopMemberData } from '../types/coopMember';
import { PopulationData } from '../types/population';

interface CoopMemberStatsProps {
  data: CoopMemberData[];
  populationData?: PopulationData[];
  prefecture: string;
  year: number;
  className?: string;
}

const CoopMemberStats: React.FC<CoopMemberStatsProps> = ({
  data,
  populationData,
  prefecture,
  year,
  className = ''
}) => {
  // 組合員統計データを計算
  const calculateCoopStats = () => {
    if (!data || data.length === 0) {
      return {
        totalMembers: 0,
        ageBreakdown: [],
        maxMemberCount: 0,
        membershipRate: 0
      };
    }

    // 20歳未満と100歳以上を除外
    const validData = data.filter(item => 
      item.memberCount > 0 && 
      !['0-4', '5-9', '10-14', '15-19', '100歳以上'].includes(item.ageGroup)
    );

    // 総組合員数を計算（千人単位から人単位に変換）
    const totalMembers = validData.reduce((sum, item) => sum + item.memberCount * 1000, 0);

    // 組合員シェア率を計算（人口データがある場合）
    let membershipRate = 0;
    if (populationData && populationData.length > 0) {
      // 20歳以上の総人口を計算
      const adultPopulation = populationData
        .filter(item => {
          const ageStart = parseInt(item.ageGroup.split('-')[0]);
          return ageStart >= 20;
        })
        .reduce((sum, item) => {
          // 全国データのみ特別処理、都道府県データはそのまま
          const isNational = item.prefectureCode === '00000';
          const population = isNational 
            ? item.population // 全国データ：既に実人数なのでそのまま使用
            : item.population * 1000; // 都道府県データ：千人単位から実人数に変換
          return sum + population;
        }, 0);

      if (adultPopulation > 0) {
        membershipRate = (totalMembers / adultPopulation) * 100;
      }
    }

    // 年齢別組合員シェア率とデータを計算
    const ageBreakdown = validData.map(item => {
      const memberCount = item.memberCount * 1000; // 千人単位から人単位に変換
      
      // 組合員の内部構成比を計算
      const compositionPercentage = totalMembers > 0 ? (memberCount / totalMembers) * 100 : 0;
      
      // 年齢別組合員シェア率を計算（該当年齢層の人口に対する組合員の割合）
      let shareRate = 0;
      if (populationData && populationData.length > 0) {
        const agePopulation = populationData
          .filter(popItem => popItem.ageGroup === item.ageGroup)
          .reduce((sum, popItem) => {
            // 全国データのみ特別処理、都道府県データはそのまま
            const isNational = popItem.prefectureCode === '00000';
            const population = isNational 
              ? popItem.population // 全国データ：既に実人数なのでそのまま使用
              : popItem.population * 1000; // 都道府県データ：千人単位から実人数に変換
            return sum + population;
          }, 0);
        
        if (agePopulation > 0) {
          shareRate = (memberCount / agePopulation) * 100;
        }
      }
      
      return {
        ageGroup: item.ageGroup,
        memberCount,
        compositionPercentage, // 組合員内の構成比
        shareRate // 該当年齢層人口に対するシェア率
      };
    }).sort((a, b) => {
      // 年齢順にソート
      const aStart = parseInt(a.ageGroup.split('-')[0]);
      const bStart = parseInt(b.ageGroup.split('-')[0]);
      return aStart - bStart;
    });

    const maxMemberCount = Math.max(...ageBreakdown.map(item => item.memberCount));

    return {
      totalMembers,
      ageBreakdown,
      maxMemberCount,
      membershipRate
    };
  };

  const stats = calculateCoopStats();

  if (stats.totalMembers === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-orange-900 border-b border-orange-300 pb-2">
        {prefecture} ({year}年) 組合員数推計
      </h3>
      
      {/* 総組合員数 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-orange-800">総組合員数</h4>
        <div className="bg-orange-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-orange-700">推定組合員数:</span>
            <span className="font-bold text-orange-800 text-lg">{stats.totalMembers.toLocaleString()}人</span>
          </div>
          {stats.membershipRate > 0 && (
            <div className="flex justify-between">
              <span className="text-orange-700">組合員シェア率:</span>
              <span className="font-bold text-orange-800">{stats.membershipRate.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 年齢別組合員シェア率 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-orange-800">年齢別組合員シェア率</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.ageBreakdown.map((item, index) => (
            <div key={item.ageGroup} className="bg-white border border-orange-200 rounded-lg p-3">
              <div className="text-center mb-2">
                <div className="text-orange-700 font-medium text-sm">{item.ageGroup}歳</div>
                <div className="text-orange-800 font-bold text-lg">
                  {item.shareRate > 0 ? `${item.shareRate.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-xs text-orange-600">
                  {item.memberCount.toLocaleString()}人
                </div>
                <div className="text-xs text-orange-500">
                  構成比: {item.compositionPercentage.toFixed(1)}%
                </div>
              </div>
              
              {/* 横棒グラフ（シェア率ベース） */}
              <div className="w-full bg-orange-100 rounded-full h-4 relative overflow-hidden">
                {item.shareRate > 0 ? (
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${item.shareRate}%` // シェア率そのものを使用
                    }}
                  />
                ) : (
                  <div className="w-full h-4 bg-gray-200 rounded-full" />
                )}
                {/* スケール表示（0%, 25%, 50%, 75%, 100%） */}
                <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
                  <div className="w-px h-2 bg-gray-400 opacity-50"></div>
                  <div className="w-px h-2 bg-gray-400 opacity-50"></div>
                  <div className="w-px h-2 bg-gray-400 opacity-50"></div>
                  <div className="w-px h-2 bg-gray-400 opacity-50"></div>
                  <div className="w-px h-2 bg-gray-400 opacity-50"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-orange-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              {item.shareRate > 0 && (
                <div className="text-xs text-orange-400 mt-1 text-center">
                  組合員シェア
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 年齢分布の特徴 */}
      <div className="space-y-2">
        <h4 className="font-semibold text-orange-800">年齢分布の特徴</h4>
        <div className="bg-orange-50 rounded-lg p-3">
          {(() => {
            // 最も高いシェア率の年齢層を特定
            const maxShareAge = stats.ageBreakdown.reduce((prev, current) => 
              (prev.shareRate > current.shareRate) ? prev : current
            );
            
            // 最も多い組合員数の年齢層を特定
            const maxMemberAge = stats.ageBreakdown.reduce((prev, current) => 
              (prev.compositionPercentage > current.compositionPercentage) ? prev : current
            );
            
            // 75歳以上の構成比を計算
            const over75Composition = stats.ageBreakdown
              .filter(item => parseInt(item.ageGroup.split('-')[0]) >= 75)
              .reduce((sum, item) => sum + item.compositionPercentage, 0);

            return (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">最高シェア率:</span>
                  <span className="font-semibold text-orange-800">
                    {maxShareAge.ageGroup}歳 ({maxShareAge.shareRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">最多組合員層:</span>
                  <span className="font-semibold text-orange-800">
                    {maxMemberAge.ageGroup}歳 ({maxMemberAge.compositionPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">75歳以上の構成比:</span>
                  <span className="font-semibold text-orange-800">{over75Composition.toFixed(1)}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default CoopMemberStats;