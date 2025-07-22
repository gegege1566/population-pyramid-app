import React from 'react';

interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  className?: string;
}

const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  availableYears,
  onYearChange,
  className = ''
}) => {
  const sortedYears = [...availableYears].sort((a, b) => a - b);
  const currentYear = new Date().getFullYear();
  
  // 過去データと将来推計データに分割
  const pastYears = sortedYears.filter(year => year <= currentYear);
  const futureYears = sortedYears.filter(year => year > currentYear);

  const getYearStyle = (year: number) => {
    const isSelected = selectedYear === year;
    const isFuture = year > currentYear;
    
    if (isSelected) {
      return isFuture 
        ? 'bg-purple-500 text-white border-purple-500'
        : 'bg-green-500 text-white border-green-500';
    }
    
    return isFuture
      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        表示年度を選択
      </label>
      
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {pastYears.length > 0 && (
          <optgroup label="過去データ（実績値）">
            {pastYears.map(year => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </optgroup>
        )}
        {futureYears.length > 0 && (
          <optgroup label="将来推計（予測値）">
            {futureYears.map(year => (
              <option key={year} value={year}>
                {year}年 (推計)
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* 過去データボタン */}
      {pastYears.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></span>
            過去データ（実績値）
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {pastYears.map(year => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${getYearStyle(year)}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 将来推計データボタン */}
      {futureYears.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-300 rounded mr-2"></span>
            将来推計（予測値）
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {futureYears.map(year => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${getYearStyle(year)}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* スライダー */}
      {availableYears.length > 1 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">スライダーで選択</div>
          <div className="relative">
            <input
              type="range"
              min={Math.min(...availableYears)}
              max={Math.max(...availableYears)}
              step="5"
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                if (availableYears.includes(year)) {
                  onYearChange(year);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.min(...availableYears)}</span>
              <span className="font-medium">{selectedYear}</span>
              <span>{Math.max(...availableYears)}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default YearSelector;