import { PREFECTURE_CODES } from '../data/prefectures';

/**
 * 選択された都道府県コードから地域名を取得する関数
 * @param selectedPrefCodes 選択された都道府県コードの配列
 * @returns 地域名文字列
 */
export const getSelectedPrefectureNames = (selectedPrefCodes: string[]): string => {
  if (selectedPrefCodes.length === 0) return '未選択';
  
  if (selectedPrefCodes.length === 1) {
    const prefCode = selectedPrefCodes[0];
    return prefCode === '00000' ? '全国（日本）' : 
      PREFECTURE_CODES[prefCode] || '未選択';
  }
  
  // 複数地域選択時：具体的な都道府県名を列挙
  const prefNames = selectedPrefCodes
    .map(code => PREFECTURE_CODES[code])
    .filter(name => name) // 存在しない都道府県コードを除外
    .sort(); // アルファベット順にソート
  
  // 長すぎる場合は省略形を使用
  if (prefNames.length <= 3) {
    return prefNames.join('・');
  } else if (prefNames.length <= 5) {
    return prefNames.slice(0, 3).join('・') + `他${prefNames.length - 3}県`;
  } else {
    return prefNames.slice(0, 2).join('・') + `他${prefNames.length - 2}都道府県`;
  }
};

/**
 * Excel用の詳細な地域名を取得する関数（全都道府県名を表示）
 * @param selectedPrefCodes 選択された都道府県コードの配列
 * @returns Excel用地域名文字列
 */
export const getDetailedPrefectureNames = (selectedPrefCodes: string[]): string => {
  if (selectedPrefCodes.length === 0) return '未選択';
  
  if (selectedPrefCodes.length === 1) {
    const prefCode = selectedPrefCodes[0];
    return prefCode === '00000' ? '全国（日本）' : 
      PREFECTURE_CODES[prefCode] || '未選択';
  }
  
  // 複数地域選択時：すべての都道府県名を列挙（制限なし）
  const prefNames = selectedPrefCodes
    .map(code => PREFECTURE_CODES[code])
    .filter(name => name) // 存在しない都道府県コードを除外
    .sort(); // アルファベット順にソート
  
  return prefNames.join('・');
};

/**
 * シート名・タイトル用の省略形地域名を取得する関数
 * @param selectedPrefCodes 選択された都道府県コードの配列
 * @returns シート名・タイトル用の省略形地域名文字列
 */
export const getAbbreviatedPrefectureNames = (selectedPrefCodes: string[]): string => {
  if (selectedPrefCodes.length === 0) return '未選択';
  
  if (selectedPrefCodes.length === 1) {
    const prefCode = selectedPrefCodes[0];
    return prefCode === '00000' ? '全国' : 
      PREFECTURE_CODES[prefCode]?.replace(/[県府都]/g, '') || '未選択';
  }
  
  // 複数地域選択時：数値表示
  return `${selectedPrefCodes.length}地域`;
};

/**
 * PDF用のタイトル地域名を取得する関数（表示に適した長さに調整）
 * @param selectedPrefCodes 選択された都道府県コードの配列
 * @returns PDF用タイトル地域名文字列
 */
export const getPDFTitlePrefectureNames = (selectedPrefCodes: string[]): string => {
  if (selectedPrefCodes.length === 0) return '未選択';
  
  if (selectedPrefCodes.length === 1) {
    const prefCode = selectedPrefCodes[0];
    return prefCode === '00000' ? '全国（日本）' : 
      PREFECTURE_CODES[prefCode] || '未選択';
  }
  
  // 複数地域選択時：PDFタイトルに適した長さ
  const prefNames = selectedPrefCodes
    .map(code => PREFECTURE_CODES[code])
    .filter(name => name)
    .sort();
  
  if (prefNames.length <= 5) {
    return prefNames.join('・');
  } else if (prefNames.length <= 10) {
    return prefNames.slice(0, 4).join('・') + `他${prefNames.length - 4}都道府県`;
  } else {
    return prefNames.slice(0, 3).join('・') + `他${prefNames.length - 3}都道府県`;
  }
};

/**
 * ファイル名用の安全な地域名を取得する関数
 * @param selectedPrefCodes 選択された都道府県コードの配列
 * @returns ファイル名に使用可能な地域名文字列
 */
export const getSafeFilenamePrefectureNames = (selectedPrefCodes: string[]): string => {
  if (selectedPrefCodes.length === 0) return '未選択';
  
  if (selectedPrefCodes.length === 1) {
    const prefCode = selectedPrefCodes[0];
    return prefCode === '00000' ? '全国' : 
      PREFECTURE_CODES[prefCode]?.replace(/[県府都]/g, '') || '未選択';
  }
  
  // 複数地域選択時：ファイル名に適した形式
  const prefNames = selectedPrefCodes
    .map(code => PREFECTURE_CODES[code]?.replace(/[県府都]/g, ''))
    .filter(name => name)
    .sort();
  
  if (prefNames.length <= 3) {
    return prefNames.join('_');
  } else {
    return `${prefNames.slice(0, 2).join('_')}_他${prefNames.length - 2}地域`;
  }
};