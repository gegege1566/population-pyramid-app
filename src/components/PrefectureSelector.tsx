import React from 'react';
import { PREFECTURES } from '../data/prefectures';

interface PrefectureSelectorProps {
  selectedPrefCode: string;
  onPrefectureChange: (prefCode: string) => void;
  className?: string;
}

const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({
  selectedPrefCode,
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

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        都道府県を選択
      </label>
      
      <select
        value={selectedPrefCode}
        onChange={(e) => onPrefectureChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">都道府県を選択してください</option>
        {regionOrder.map(region => (
          <optgroup key={region} label={region}>
            {groupedPrefectures[region]?.map(pref => (
              <option key={pref.code} value={pref.code}>
                {pref.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* クイックアクセスボタン */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['13', '27', '23', '14'].map(code => {
          const pref = PREFECTURES.find(p => p.code === code);
          return (
            <button
              key={code}
              onClick={() => onPrefectureChange(code)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedPrefCode === code
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pref?.name}
            </button>
          );
        })}
      </div>

      {/* 地域別タブ表示 */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">地域別選択</div>
        <div className="space-y-2">
          {regionOrder.map(region => (
            <details key={region} className="group">
              <summary className="cursor-pointer px-3 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                {region}地方
              </summary>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4">
                {groupedPrefectures[region]?.map(pref => (
                  <button
                    key={pref.code}
                    onClick={() => onPrefectureChange(pref.code)}
                    className={`px-2 py-1 text-sm rounded border transition-colors text-left ${
                      selectedPrefCode === pref.code
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pref.name}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrefectureSelector;