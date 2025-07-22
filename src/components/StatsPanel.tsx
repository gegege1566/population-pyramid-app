import React from 'react';
import { PopulationData } from '../types/population';
import { calculateStats } from '../utils/populationAnalysis';

interface StatsPanelProps {
  data: PopulationData[];
  prefecture: string;
  year: number;
  className?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  data, 
  prefecture, 
  year, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-center">データがありません</div>
      </div>
    );
  }

  const stats = calculateStats(data);

  const statItems = [
    {
      label: '総人口',
      value: (stats.totalPopulation * 1000).toLocaleString(),
      unit: '人',
      color: 'text-blue-600'
    },
    {
      label: '男性人口',
      value: (stats.malePopulation * 1000).toLocaleString(),
      unit: '人',
      color: 'text-blue-500'
    },
    {
      label: '女性人口',
      value: (stats.femalePopulation * 1000).toLocaleString(),
      unit: '人',
      color: 'text-pink-500'
    },
    {
      label: '性比',
      value: stats.genderRatio.toString(),
      unit: '（女性100人に対する男性数）',
      color: 'text-gray-600'
    }
  ];

  const ratioItems = [
    {
      label: '年少人口率',
      description: '（0-14歳）',
      value: stats.under15Ratio,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: '生産年齢人口率',
      description: '（15-64歳）',
      value: stats.workingRatio,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: '老年人口率',
      description: '（65歳以上）',
      value: stats.elderlyRatio,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: '従属人口指数',
      description: '（年少+老年）/生産年齢×100',
      value: stats.dependencyRatio,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">
          {prefecture} ({year}年) 人口統計
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* 基本統計 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">基本統計</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">{item.label}</div>
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.value}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 年齢構成比 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">年齢構成比</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ratioItems.map((item, index) => (
              <div key={index} className={`${item.bgColor} rounded-lg p-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${item.color}`}>
                    {item.value}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 社会指標の解釈 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">指標の解釈</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              • 老年人口率 {stats.elderlyRatio >= 28 ? '28%以上（超高齢社会）' : 
                         stats.elderlyRatio >= 21 ? '21-28%（高齢社会）' : 
                         stats.elderlyRatio >= 7 ? '7-21%（高齢化社会）' : '7%未満'}
            </div>
            <div>
              • 従属人口指数 {stats.dependencyRatio >= 70 ? '高い（負担大）' : 
                           stats.dependencyRatio >= 50 ? '中程度' : '低い（負担小）'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;