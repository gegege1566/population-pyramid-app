import React from 'react';
import { PopulationData } from '../types/population';

interface PopulationStatsProps {
  data: PopulationData[];
  prefecture: string;
  year: number;
  className?: string;
}

const PopulationStats: React.FC<PopulationStatsProps> = ({
  data,
  prefecture,
  year,
  className = ''
}) => {
  // 統計データを計算
  const calculateStats = () => {
    if (!data || data.length === 0) {
      return {
        totalPopulation: 0,
        malePopulation: 0,
        femalePopulation: 0,
        youngPopulation: 0,
        workingAgePopulation: 0,
        elderlyPopulation: 0,
        youngRate: 0,
        workingAgeRate: 0,
        elderlyRate: 0,
        dependencyRatio: 0
      };
    }

    // デバッグ: データサンプルをログ出力
    const isNational = data.length > 0 && data[0].prefectureCode === '00000';
    console.log(`📊 PopulationStats DEBUG - ${isNational ? '全国' : '都道府県'}データ:`, 
      data.slice(0, 4).map(d => `${d.ageGroup} ${d.gender}: ${d.population.toLocaleString()}`));

    let totalMale = 0;
    let totalFemale = 0;
    let young = 0; // 0-14歳
    let workingAge = 0; // 15-64歳
    let elderly = 0; // 65歳以上

    data.forEach(item => {
      // 全国データと都道府県データを区別して処理
      const isNational = item.prefectureCode === '00000';
      const population = isNational 
        ? item.population * 1000 // 全国データ：APIで1000で割った後なので1000倍で実人数
        : item.population * 1000; // 都道府県データ：千人単位なので1000倍で実人数
      const ageStart = parseInt(item.ageGroup.split('-')[0]);
      
      if (item.gender === 'male') {
        totalMale += population;
      } else {
        totalFemale += population;
      }

      // 3区分別人口
      if (ageStart <= 14) {
        young += population;
      } else if (ageStart <= 64) {
        workingAge += population;
      } else {
        elderly += population;
      }
    });

    const total = totalMale + totalFemale;
    const youngRate = total > 0 ? (young / total) * 100 : 0;
    const workingAgeRate = total > 0 ? (workingAge / total) * 100 : 0;
    const elderlyRate = total > 0 ? (elderly / total) * 100 : 0;
    const dependencyRatio = workingAge > 0 ? ((young + elderly) / workingAge) * 100 : 0;

    return {
      totalPopulation: total,
      malePopulation: totalMale,
      femalePopulation: totalFemale,
      youngPopulation: young,
      workingAgePopulation: workingAge,
      elderlyPopulation: elderly,
      youngRate,
      workingAgeRate,
      elderlyRate,
      dependencyRatio
    };
  };

  const stats = calculateStats();

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2">
        {prefecture} ({year}年) 人口統計
      </h3>
      
      {/* 総人口・性別人口 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">人口総数</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700">総人口:</span>
            <span className="font-semibold">{stats.totalPopulation.toLocaleString()}人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">男性:</span>
            <span className="font-semibold text-blue-600">{stats.malePopulation.toLocaleString()}人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pink-600">女性:</span>
            <span className="font-semibold text-pink-600">{stats.femalePopulation.toLocaleString()}人</span>
          </div>
        </div>
      </div>

      {/* 3区分別人口 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">年齢3区分別人口</h4>
        <div className="space-y-3">
          {/* 年少人口 */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-green-700 font-medium">年少人口 (0-14歳)</span>
              <span className="text-green-800 font-bold">{stats.youngRate.toFixed(1)}%</span>
            </div>
            <div className="text-sm text-green-600">
              {stats.youngPopulation.toLocaleString()}人
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.youngRate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 生産年齢人口 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-700 font-medium">生産年齢人口 (15-64歳)</span>
              <span className="text-blue-800 font-bold">{stats.workingAgeRate.toFixed(1)}%</span>
            </div>
            <div className="text-sm text-blue-600">
              {stats.workingAgePopulation.toLocaleString()}人
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.workingAgeRate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 老年人口 */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-orange-700 font-medium">老年人口 (65歳以上)</span>
              <span className="text-orange-800 font-bold">{stats.elderlyRate.toFixed(1)}%</span>
            </div>
            <div className="text-sm text-orange-600">
              {stats.elderlyPopulation.toLocaleString()}人
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.elderlyRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 従属人口指数 */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800">従属人口指数</h4>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-purple-700">(年少+老年) ÷ 生産年齢</span>
            <span className="font-bold text-purple-800">{stats.dependencyRatio.toFixed(1)}</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            生産年齢人口100人に対する従属人口の比率
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopulationStats;