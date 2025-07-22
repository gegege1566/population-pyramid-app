import React, { useState, useEffect } from 'react';
import PopulationPyramid from './components/PopulationPyramid';
import PrefectureSelector from './components/PrefectureSelector';
import YearSelector from './components/YearSelector';
import StatsPanel from './components/StatsPanel';
import YearComparisonDemo from './components/YearComparisonDemo';
import { usePopulationData, useAvailableYears } from './hooks/usePopulationData';
import { LocalDataService } from './services/localDataService';

const localDataService = new LocalDataService();

function App() {
  const [selectedPrefCode, setSelectedPrefCode] = useState('13'); // 東京都をデフォルト
  const [selectedYear, setSelectedYear] = useState(2020);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const { years: availableYears, loading: yearsLoading } = useAvailableYears();
  const { data, loading, error } = usePopulationData(selectedPrefCode, selectedYear);

  // 初期化とデータプリロード
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app and preloading data...');
        await localDataService.preloadAllData();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // エラーでも初期化完了とする
      }
    };

    initializeApp();
  }, []);

  // 利用可能年度が読み込まれたら2020年を選択（5年刻みの中心年）
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      // 2020年が利用可能な場合は2020年を、そうでなければ最も近い年を選択
      const targetYear = availableYears.includes(2020) ? 2020 : availableYears[Math.floor(availableYears.length / 2)];
      setSelectedYear(targetYear);
    }
  }, [availableYears, selectedYear]);

  const selectedPrefecture = selectedPrefCode 
    ? require('./data/prefectures').PREFECTURE_CODES[selectedPrefCode] || '未選択'
    : '未選択';

  const handlePrefectureChange = (prefCode: string) => {
    setSelectedPrefCode(prefCode);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  if (!isInitialized || yearsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">アプリを初期化しています...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              都道府県別人口ピラミッド
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {selectedPrefecture} • {selectedYear}年
              </div>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  showComparison
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showComparison ? '単年度表示' : '年度比較'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー - 選択UI */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <PrefectureSelector
                selectedPrefCode={selectedPrefCode}
                onPrefectureChange={handlePrefectureChange}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <YearSelector
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={handleYearChange}
              />
            </div>

            {/* 統計パネル */}
            {data.length > 0 && (
              <StatsPanel
                data={data}
                prefecture={selectedPrefecture}
                year={selectedYear}
              />
            )}
          </div>

          {/* メインエリア - 人口ピラミッドまたは年度比較 */}
          <div className="lg:col-span-3">
            {showComparison ? (
              <YearComparisonDemo
                selectedPrefCode={selectedPrefCode}
                availableYears={availableYears}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {loading && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <div className="text-gray-600">データを読み込んでいます...</div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">⚠ エラーが発生しました</div>
                      <div className="text-gray-600 text-sm">{error}</div>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        再読み込み
                      </button>
                    </div>
                  </div>
                )}

                {!loading && !error && data.length === 0 && selectedPrefCode && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-gray-500 mb-2">データがありません</div>
                      <div className="text-gray-400 text-sm">
                        {selectedPrefecture} ({selectedYear}年) のデータが見つかりません
                      </div>
                    </div>
                  </div>
                )}

                {!loading && !error && data.length > 0 && (
                  <PopulationPyramid
                    data={data}
                    prefecture={selectedPrefecture}
                    year={selectedYear}
                    width={800}
                    height={600}
                  />
                )}

                {!selectedPrefCode && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-gray-500 mb-2">都道府県を選択してください</div>
                      <div className="text-gray-400 text-sm">
                        左側のパネルから都道府県を選択すると人口ピラミッドが表示されます
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500 space-y-1">
            <div>
              <strong>データ範囲:</strong> 
              {availableYears.length > 0 
                ? `${Math.min(...availableYears)}-${Math.max(...availableYears)}年 (${availableYears.length}年度)`
                : '読み込み中...'}
            </div>
            <div>
              過去データ: 実績値 | 将来データ: 国立社会保障・人口問題研究所による推計値
            </div>
            <div className="text-xs">
              データソース: e-Stat (政府統計の総合窓口) • 
              本サービスは政府統計データを利用していますが、内容は政府によって保証されたものではありません
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;