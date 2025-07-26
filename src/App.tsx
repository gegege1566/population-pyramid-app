import React, { useState, useEffect } from 'react';
import PopulationPyramid from './components/PopulationPyramid';
import PrefectureSelector from './components/PrefectureSelector';
import YearSelector from './components/YearSelector';
import YearComparisonDemo from './components/YearComparisonDemo';
import PopulationStats from './components/PopulationStats';
import CoopMemberStats from './components/CoopMemberStats';
import SpendingEstimation from './components/SpendingEstimation';
import SpendingSettings from './components/SpendingSettings';
import { useAvailableYears } from './hooks/usePopulationData';
import { usePrefectureData } from './hooks/usePrefectureData';
import { useMultiplePrefectureData } from './hooks/useMultiplePrefectureData';
import { CoopMemberService } from './services/coopMemberService';
import { CoopMemberData } from './types/coopMember';
import { AgeGroupSpending, DEFAULT_AGE_GROUP_SPENDING } from './types/coopSpending';
import { getSelectedPrefectureNames, getDetailedPrefectureNames, getAbbreviatedPrefectureNames, getPDFTitlePrefectureNames } from './utils/prefectureUtils';

const coopMemberService = CoopMemberService.getInstance();

function App() {
  const [selectedPrefCodes, setSelectedPrefCodes] = useState<string[]>(['00000']); // 全国（日本）をデフォルト
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showCoopMembers, setShowCoopMembers] = useState(false);
  const [coopMemberData, setCoopMemberData] = useState<CoopMemberData[] | undefined>(undefined);
  
  // デバッグ: 初期状態をログ出力
  console.log('App.tsx - showCoopMembers initial state:', showCoopMembers);
  const [showSpendingSettings, setShowSpendingSettings] = useState(false);
  const [ageGroupSpending, setAgeGroupSpending] = useState<AgeGroupSpending[]>(DEFAULT_AGE_GROUP_SPENDING);

  const { years: availableYears, loading: yearsLoading } = useAvailableYears();
  const singlePrefectureHook = usePrefectureData();
  const multiplePrefectureHook = useMultiplePrefectureData();
  
  // 選択状態に応じて適切なフックを使用
  const isMultipleSelection = selectedPrefCodes.length > 1;
  const currentHook = isMultipleSelection ? multiplePrefectureHook : singlePrefectureHook;
  
  const { getDataForYear, isDataAvailable, loading, error, fixedScale } = currentHook;

  // 初期化
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 利用可能年度が読み込まれたら2025年を選択（最初の年度）
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      // 2025年が利用可能な場合は2025年を、そうでなければ最初の年を選択
      const targetYear = availableYears.includes(2025) ? 2025 : availableYears[0];
      setSelectedYear(targetYear);
    }
  }, [availableYears, selectedYear]);

  // 組合員データを読み込み
  useEffect(() => {
    console.log('Coop member loading effect - showCoopMembers:', showCoopMembers, 'selectedPrefCodes:', selectedPrefCodes);
    if (showCoopMembers && selectedPrefCodes.length > 0) {
      const loadCoopMemberData = async () => {
        try {
          console.log('Loading coop member data for:', selectedPrefCodes, selectedYear);
          const data = await coopMemberService.getMultipleCoopMemberData(selectedPrefCodes, selectedYear);
          console.log('Loaded coop member data:', data?.length);
          setCoopMemberData(data);
        } catch (error) {
          console.error('組合員データの読み込みに失敗:', error);
          setCoopMemberData(undefined);
        }
      };
      loadCoopMemberData();
    } else {
      console.log('Clearing coop member data');
      setCoopMemberData(undefined);
    }
  }, [showCoopMembers, selectedPrefCodes, selectedYear]);

  // 都道府県と年度データが揃った時点で初回プリロードを実行
  useEffect(() => {
    if (selectedPrefCodes.length > 0 && availableYears.length > 0) {
      if (selectedPrefCodes.length === 1) {
        // 単一選択の場合
        const prefCode = selectedPrefCodes[0];
        if (singlePrefectureHook.currentPrefCode !== prefCode) {
          singlePrefectureHook.loadPrefectureData(prefCode, availableYears);
        }
      } else {
        // 複数選択の場合
        const currentCodesStr = multiplePrefectureHook.currentPrefCodes.sort().join(',');
        const selectedCodesStr = selectedPrefCodes.sort().join(',');
        if (currentCodesStr !== selectedCodesStr) {
          multiplePrefectureHook.loadMultiplePrefectureData(selectedPrefCodes, availableYears);
        }
      }
    }
  }, [selectedPrefCodes, availableYears, singlePrefectureHook, multiplePrefectureHook]);

  // 表示用地域名（UI表示用）
  const selectedPrefecture = getSelectedPrefectureNames(selectedPrefCodes);
  // 詳細地域名（Excel用）
  const detailedPrefectureName = getDetailedPrefectureNames(selectedPrefCodes);
  // 省略形地域名（シート名・タイトル用）
  const abbreviatedPrefectureName = getAbbreviatedPrefectureNames(selectedPrefCodes);
  // PDF用タイトル地域名
  const pdfTitlePrefectureName = getPDFTitlePrefectureNames(selectedPrefCodes);

  const handlePrefectureChange = (prefCodes: string[]) => {
    setSelectedPrefCodes(prefCodes);
    
    // エリア選択時は必ず2025年を選択（全国（日本）以外）
    if (prefCodes.length > 0 && !prefCodes.includes('00000') && availableYears.includes(2025)) {
      setSelectedYear(2025);
    }
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
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Population pyramid simulation
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {selectedPrefecture} • {selectedYear}年
              </div>
              <button
                onClick={() => {
                  console.log('Coop member button clicked! Current state:', showCoopMembers);
                  setShowCoopMembers(!showCoopMembers);
                  console.log('Setting showCoopMembers to:', !showCoopMembers);
                }}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  showCoopMembers
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                組合員数推計
              </button>
              {showCoopMembers && (
                <button
                  onClick={() => setShowSpendingSettings(true)}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  利用金額設定
                </button>
              )}
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
      <main className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
        <div className={`grid grid-cols-1 gap-6 ${showComparison ? 'lg:grid-cols-5' : 'lg:grid-cols-8'}`}>
          {/* 左サイドバー - 都道府県選択UI */}
          <div className={showComparison ? "lg:col-span-1 space-y-6" : "lg:col-span-2 space-y-6"}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <PrefectureSelector
                selectedPrefCodes={selectedPrefCodes}
                onPrefectureChange={handlePrefectureChange}
              />
            </div>
          </div>

          {/* メインエリア - 人口ピラミッドまたは年度比較 */}
          <div className={showComparison ? "lg:col-span-4" : "lg:col-span-4"}>
            {showComparison ? (
              <YearComparisonDemo
                selectedPrefCodes={selectedPrefCodes}
                availableYears={availableYears}
                showCoopMembers={showCoopMembers}
                onCoopMembersChange={setShowCoopMembers}
                ageGroupSpending={ageGroupSpending}
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

                {!loading && !error && selectedPrefCodes.length > 0 && isDataAvailable(selectedYear) && getDataForYear(selectedYear).length === 0 && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-gray-500 mb-2">データがありません</div>
                      <div className="text-gray-400 text-sm">
                        {selectedPrefecture} ({selectedYear}年) のデータが見つかりません
                      </div>
                    </div>
                  </div>
                )}

                {!loading && !error && isDataAvailable(selectedYear) && getDataForYear(selectedYear).length > 0 && (
                  <div className="space-y-4">
                    {/* グラフタイトル */}
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedPrefecture} 人口ピラミッド ({selectedYear}年)
                      </h2>
                      {selectedPrefCodes.length > 1 && (
                        <p className="text-sm text-gray-600 mt-1">
                          複数地域の合算値を表示
                        </p>
                      )}
                    </div>
                    
                    <div className="overflow-x-auto">
                      <PopulationPyramid
                        data={getDataForYear(selectedYear)}
                        prefecture={detailedPrefectureName}
                        year={selectedYear}
                        width={800}
                        height={600}
                        fixedScale={fixedScale || undefined}
                        showCoopMembers={showCoopMembers}
                        coopMemberData={coopMemberData}
                        abbreviatedName={abbreviatedPrefectureName}
                        pdfTitleName={pdfTitlePrefectureName}
                      />
                    </div>

                    {/* 組合員数統計 */}
                    {showCoopMembers && (
                      <div className="mt-6 space-y-6">
                        <CoopMemberStats
                          data={coopMemberData || []}
                          populationData={getDataForYear(selectedYear)}
                          prefecture={detailedPrefectureName}
                          year={selectedYear}
                        />
                        {/* 利用金額推定 */}
                        <SpendingEstimation
                          coopMemberData={coopMemberData}
                          year={selectedYear}
                          prefecture={detailedPrefectureName}
                          ageGroupSpending={ageGroupSpending}
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedPrefCodes.length === 0 && (
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

          {/* 右サイドバー - 年度選択UI (年度比較時は非表示) */}
          {!showComparison && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <YearSelector
                  selectedYear={selectedYear}
                  availableYears={availableYears}
                  onYearChange={handleYearChange}
                />
              </div>
              
              {/* 人口統計表示 */}
              {getDataForYear(selectedYear).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <PopulationStats
                    data={getDataForYear(selectedYear)}
                    prefecture={selectedPrefecture}
                    year={selectedYear}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4">
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
            {showCoopMembers && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 text-left max-w-4xl mx-auto">
                <div className="font-semibold mb-1">生協組合員数推計について:</div>
                <div className="whitespace-pre-line">{coopMemberService.getNoticeText()}</div>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* 利用金額設定モーダル */}
      <SpendingSettings
        isOpen={showSpendingSettings}
        onClose={() => setShowSpendingSettings(false)}
        onSpendingChange={setAgeGroupSpending}
      />
    </div>
  );
}

export default App;