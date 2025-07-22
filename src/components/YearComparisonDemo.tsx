import React, { useState } from 'react';
import PopulationPyramid from './PopulationPyramid';
import { usePopulationData } from '../hooks/usePopulationData';

interface YearComparisonDemoProps {
  selectedPrefCode: string;
  availableYears: number[];
}

const YearComparisonDemo: React.FC<YearComparisonDemoProps> = ({
  selectedPrefCode,
  availableYears
}) => {
  const [year1, setYear1] = useState(availableYears.find(y => y <= 2024) || availableYears[0]);
  const [year2, setYear2] = useState(availableYears.find(y => y >= 2025) || availableYears[availableYears.length - 1]);

  const { data: data1, loading: loading1 } = usePopulationData(selectedPrefCode, year1);
  const { data: data2, loading: loading2 } = usePopulationData(selectedPrefCode, year2);

  const prefectureName = selectedPrefCode 
    ? require('../data/prefectures').PREFECTURE_CODES[selectedPrefCode] || '未選択'
    : '未選択';

  if (!selectedPrefCode) {
    return (
      <div className="text-center p-8 text-gray-500">
        都道府県を選択してください
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          年度比較表示 - {prefectureName}
        </h3>
        <div className="text-sm text-gray-600 mb-4">
          ※固定スケールにより異なる年度間での人口変化を正確に比較できます
        </div>
        
        {/* 年度選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較年度1（過去データ）
            </label>
            <select
              value={year1}
              onChange={(e) => setYear1(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {availableYears.filter(year => year <= new Date().getFullYear()).map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較年度2（将来推計）
            </label>
            <select
              value={year2}
              onChange={(e) => setYear2(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableYears.filter(year => year > new Date().getFullYear()).map(year => (
                <option key={year} value={year}>{year}年（推計）</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(loading1 || loading2) && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600">データを読み込んでいます...</div>
          </div>
        </div>
      )}

      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 年度1のピラミッド */}
          <div className="border border-gray-200 rounded p-4">
            <PopulationPyramid
              data={data1}
              prefecture={prefectureName}
              year={year1}
              width={400}
              height={500}
            />
          </div>

          {/* 年度2のピラミッド */}
          <div className="border border-gray-200 rounded p-4">
            <PopulationPyramid
              data={data2}
              prefecture={prefectureName}
              year={year2}
              width={400}
              height={500}
            />
          </div>
        </div>
      )}

      {/* 比較解説 */}
      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">比較のポイント:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 横軸のスケールが固定されているため、人口の絶対値を正確に比較できます</li>
            <li>• {year2}年は{year1}年と比べて、少子高齢化の進行を視覚的に確認できます</li>
            <li>• 年齢構成の変化パターンが一目で理解できます</li>
            <li>• 左が{year1}年（{year1 <= new Date().getFullYear() ? '実績値' : '推計値'}）、右が{year2}年（将来推計）</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default YearComparisonDemo;