import React from 'react';
import { PREFECTURES } from '../data/prefectures';

interface PrefectureSelectorProps {
  selectedPrefCodes: string[];
  onPrefectureChange: (prefCodes: string[]) => void;
  className?: string;
}

const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({
  selectedPrefCodes,
  onPrefectureChange,
  className = ''
}) => {
  const groupedPrefectures = PREFECTURES.reduce((acc, pref) => {
    if (!acc[pref.region]) {
      acc[pref.region] = [];
    }
    acc[pref.region].push(pref);
    return acc;
  }, {} as { [region: string]: typeof PREFECTURES });

  const regionOrder = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'];

  const handleTogglePrefecture = (prefCode: string) => {
    if (selectedPrefCodes.includes(prefCode)) {
      // 選択解除
      onPrefectureChange(selectedPrefCodes.filter(code => code !== prefCode));
    } else {
      // 選択追加
      if (prefCode === '00000') {
        // 全国を選択した場合、他をすべて解除
        onPrefectureChange(['00000']);
      } else {
        // 都道府県を選択した場合、全国を除外
        const newSelection = selectedPrefCodes.filter(code => code !== '00000');
        onPrefectureChange([...newSelection, prefCode]);
      }
    }
  };

  const handleRegionSelect = (region: string) => {
    const regionPrefectures = groupedPrefectures[region] || [];
    const regionCodes = regionPrefectures.map(pref => pref.code);
    const allRegionSelected = regionCodes.every(code => selectedPrefCodes.includes(code));
    
    if (allRegionSelected) {
      // 地方の全県が選択されている場合は解除
      onPrefectureChange(selectedPrefCodes.filter(code => !regionCodes.includes(code)));
    } else {
      // 地方の県を全選択（全国を除外して既存の選択を維持）
      const newCodes = selectedPrefCodes.filter(code => code !== '00000');
      regionCodes.forEach(code => {
        if (!newCodes.includes(code)) {
          newCodes.push(code);
        }
      });
      onPrefectureChange(newCodes);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        都道府県を選択（複数選択可）
      </label>
      
      {selectedPrefCodes.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-md">
          <div className="text-sm font-medium text-blue-700 mb-2">選択中: {selectedPrefCodes.length}件</div>
          <div className="flex flex-wrap gap-1">
            {selectedPrefCodes.map(code => {
              const pref = PREFECTURES.find(p => p.code === code);
              return (
                <span key={code} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {code === '00000' ? '全国' : pref?.name}
                  <button
                    onClick={() => handleTogglePrefecture(code)}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}


      {/* 全国（日本）ボタン */}
      <div className="mb-4">
        <button
          onClick={() => handleTogglePrefecture('00000')}
          className={`w-full px-4 py-3 text-sm rounded-lg border transition-colors font-medium ${
            selectedPrefCodes.includes('00000')
              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100'
          }`}
        >
          全国（日本）
        </button>
      </div>

      {/* 地域別タブ表示 */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">地域別選択</div>
        <div className="space-y-2">
          {regionOrder.map(region => {
            const regionPrefectures = groupedPrefectures[region] || [];
            const selectedInRegion = regionPrefectures.filter(pref => selectedPrefCodes.includes(pref.code)).length;
            const allRegionSelected = regionPrefectures.length > 0 && selectedInRegion === regionPrefectures.length;
            
            return (
              <details key={region} className="group" open>
                <summary className="cursor-pointer px-3 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex justify-between items-center">
                  <span>{region}地方</span>
                  <div className="flex items-center space-x-2">
                    {selectedInRegion > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {selectedInRegion}/{regionPrefectures.length}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRegionSelect(region);
                      }}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        allRegionSelected
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {allRegionSelected ? '全解除' : '全選択'}
                    </button>
                  </div>
                </summary>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4">
                  {regionPrefectures.map(pref => (
                    <button
                      key={pref.code}
                      onClick={() => handleTogglePrefecture(pref.code)}
                      className={`px-2 py-1 text-sm rounded border transition-colors text-left ${
                        selectedPrefCodes.includes(pref.code)
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pref.name}
                    </button>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrefectureSelector;