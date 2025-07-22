import React, { useState, useEffect, useRef } from 'react';
import PopulationPyramid from './PopulationPyramid';
import { usePrefectureData } from '../hooks/usePrefectureData';

interface YearComparisonDemoProps {
  selectedPrefCode: string;
  availableYears: number[];
}

const YearComparisonDemo: React.FC<YearComparisonDemoProps> = ({
  selectedPrefCode,
  availableYears
}) => {
  const [year1, setYear1] = useState(() => availableYears[0] || 2025); // 最初の年度
  const [year2, setYear2] = useState(() => availableYears[availableYears.length - 1] || 2050); // 最後の年度
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  // 利用可能年度が更新されたら年度を調整
  useEffect(() => {
    if (availableYears.length > 0) {
      setYear1(availableYears[0]);
      setYear2(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  const { loadPrefectureData, getDataForYear, isDataAvailable, loading, preloading, currentPrefCode, fixedScale } = usePrefectureData();

  // コンテナ幅を取得してグラフサイズを計算
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // グラフの幅を動的に計算
  const getGraphWidth = () => {
    // コンテナ幅から2つのグラフ、ギャップ、パディングを考慮
    const isLargeScreen = containerWidth >= 1280; // xlブレークポイント
    if (isLargeScreen) {
      // 2列表示時: 各グラフはコンテナ幅の約45%
      return Math.min(Math.floor(containerWidth * 0.45), 800);
    } else {
      // 1列表示時: コンテナ幅の90%
      return Math.min(Math.floor(containerWidth * 0.9), 800);
    }
  };

  // 都道府県変更時にデータをプリロード
  useEffect(() => {
    if (selectedPrefCode && availableYears.length > 0 && currentPrefCode !== selectedPrefCode) {
      loadPrefectureData(selectedPrefCode, availableYears);
    }
  }, [selectedPrefCode, availableYears, currentPrefCode, loadPrefectureData]);

  const data1 = getDataForYear(year1);
  const data2 = getDataForYear(year2);
  const loading1 = loading || preloading || !isDataAvailable(year1);
  const loading2 = loading || preloading || !isDataAvailable(year2);

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
    <div ref={containerRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          年度比較表示 - {prefectureName}
        </h3>
        <div className="text-sm text-gray-600 mb-4">
          ※各年度のデータから動的にスケールを計算し、詳細な人口変化を可視化
        </div>
        
        {/* 年度選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較年度1（将来推計）
            </label>
            <select
              value={year1}
              onChange={(e) => setYear1(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}年（推計）</option>
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
              {availableYears.map(year => (
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
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 年度1のピラミッド */}
            <div className="border border-gray-200 rounded p-4 flex justify-center">
              <PopulationPyramid
                data={data1}
                prefecture={prefectureName}
                year={year1}
                width={getGraphWidth()}
                height={550}
                fixedScale={fixedScale || undefined}
              />
            </div>

            {/* 年度2のピラミッド */}
            <div className="border border-gray-200 rounded p-4 flex justify-center">
              <PopulationPyramid
                data={data2}
                prefecture={prefectureName}
                year={year2}
                width={getGraphWidth()}
                height={550}
                fixedScale={fixedScale || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* 比較解説 */}
      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">比較のポイント:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 横軸のスケールが各年度のデータから動的に最適化され、詳細な変化を確認できます</li>
            <li>• {year2}年は{year1}年と比べて、少子高齢化の進行を視覚的に確認できます</li>
            <li>• 年齢構成の変化パターンが一目で理解できます</li>
            <li>• 左が{year1}年（将来推計）、右が{year2}年（将来推計）</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default YearComparisonDemo;