import React, { useState, useEffect } from 'react';
import { AgeGroupSpending, DEFAULT_AGE_GROUP_SPENDING } from '../types/coopSpending';

interface SpendingSettingsProps {
  onSpendingChange: (spending: AgeGroupSpending[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SpendingSettings: React.FC<SpendingSettingsProps> = ({
  onSpendingChange,
  isOpen,
  onClose
}) => {
  const [spending, setSpending] = useState<AgeGroupSpending[]>(DEFAULT_AGE_GROUP_SPENDING);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    // ローカルストレージから保存された設定を読み込み
    const savedSpending = localStorage.getItem('coopAgeGroupSpending');
    if (savedSpending) {
      try {
        const parsed = JSON.parse(savedSpending);
        setSpending(parsed);
        onSpendingChange(parsed);
      } catch (e) {
        console.error('Failed to parse saved spending data');
      }
    }
  }, [onSpendingChange]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setTempValue(spending[index].annualSpending.toString());
  };

  const handleSave = (index: number) => {
    const newValue = parseInt(tempValue);
    if (!isNaN(newValue) && newValue >= 0) {
      const newSpending = [...spending];
      newSpending[index] = { ...newSpending[index], annualSpending: newValue };
      setSpending(newSpending);
      onSpendingChange(newSpending);
      
      // ローカルストレージに保存
      localStorage.setItem('coopAgeGroupSpending', JSON.stringify(newSpending));
    }
    setEditingIndex(null);
    setTempValue('');
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setTempValue('');
  };

  const handleReset = () => {
    if (window.confirm('デフォルト値に戻しますか？')) {
      setSpending(DEFAULT_AGE_GROUP_SPENDING);
      onSpendingChange(DEFAULT_AGE_GROUP_SPENDING);
      localStorage.removeItem('coopAgeGroupSpending');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">年齢別年間利用金額設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          各年齢層の組合員一人あたりの年間利用金額を設定できます。
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年齢層
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年間利用金額（円）
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {spending.map((item, index) => (
                <tr key={item.ageGroup} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.ageGroup}歳
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(index);
                          if (e.key === 'Escape') handleCancel();
                        }}
                      />
                    ) : (
                      <span>{item.annualSpending.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {editingIndex === index ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(index)}
                          className="text-green-600 hover:text-green-900"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            デフォルトに戻す
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpendingSettings;