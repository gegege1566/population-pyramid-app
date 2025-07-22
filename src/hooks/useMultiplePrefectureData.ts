import { useState, useEffect, useCallback } from 'react';
import { PopulationData } from '../types/population';
import { LocalDataService } from '../services/localDataService';

const localDataService = new LocalDataService();

interface MultiplePrefectureDataState {
  data: { [year: number]: PopulationData[] };
  loading: boolean;
  error: string | null;
  currentPrefCodes: string[];
  fixedScale: number | null;
}

// 複数の都道府県データを合算する関数
const mergePopulationData = (dataArrays: PopulationData[][]): PopulationData[] => {
  if (dataArrays.length === 0) return [];
  if (dataArrays.length === 1) return dataArrays[0];

  const mergedMap = new Map<string, PopulationData>();

  dataArrays.forEach(data => {
    data.forEach(item => {
      const key = `${item.ageGroup}_${item.gender}`;
      const existing = mergedMap.get(key);
      
      if (existing) {
        existing.population += item.population;
      } else {
        mergedMap.set(key, {
          ...item,
          prefecture: 'Multiple Areas', // 複数地域を示す
          prefectureCode: 'MULTI'
        });
      }
    });
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    // 年齢グループでソート
    const ageA = parseInt(a.ageGroup.split('-')[0]);
    const ageB = parseInt(b.ageGroup.split('-')[0]);
    if (ageA !== ageB) return ageA - ageB;
    // 性別でソート（male -> female）
    return a.gender.localeCompare(b.gender);
  });
};

export const useMultiplePrefectureData = () => {
  const [state, setState] = useState<MultiplePrefectureDataState>({
    data: {},
    loading: false,
    error: null,
    currentPrefCodes: [],
    fixedScale: null
  });

  const loadMultiplePrefectureData = useCallback(async (prefCodes: string[], availableYears: number[]) => {
    if (prefCodes.length === 0 || availableYears.length === 0) return;

    // 同じ都道府県セットの場合は何もしない
    const codeStr = prefCodes.sort().join(',');
    const currentStr = state.currentPrefCodes.sort().join(',');
    if (currentStr === codeStr && Object.keys(state.data).length === availableYears.length) {
      return;
    }

    console.log(`Loading data for multiple prefectures: ${prefCodes.join(', ')}`);

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      currentPrefCodes: [...prefCodes]
    }));

    try {
      // 各年度ごとに全都道府県のデータを取得し合算
      const dataByYear: { [year: number]: PopulationData[] } = {};
      
      for (const year of availableYears) {
        const prefDataPromises = prefCodes.map(prefCode => 
          localDataService.getPopulationData(prefCode, year)
        );
        
        const prefDataArrays = await Promise.all(prefDataPromises);
        dataByYear[year] = mergePopulationData(prefDataArrays);
      }

      // 2025年のデータから固定スケールを計算
      const baseYearData = dataByYear[2025];
      let fixedScale: number | null = null;
      if (baseYearData && baseYearData.length > 0) {
        fixedScale = localDataService.calculateDynamicScale(baseYearData);
      }

      setState(prev => ({
        ...prev,
        data: dataByYear,
        loading: false,
        error: null,
        fixedScale: fixedScale
      }));

      console.log(`✅ Multiple prefecture data loaded for years: ${availableYears.join(', ')}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      console.error('Failed to load multiple prefecture data:', error);
    }
  }, [state.currentPrefCodes, state.data]);

  const getDataForYear = useCallback((year: number): PopulationData[] => {
    return state.data[year] || [];
  }, [state.data]);

  const isDataAvailable = useCallback((year: number): boolean => {
    return state.data[year] !== undefined;
  }, [state.data]);

  return {
    loadMultiplePrefectureData,
    getDataForYear,
    isDataAvailable,
    loading: state.loading,
    error: state.error,
    currentPrefCodes: state.currentPrefCodes,
    fixedScale: state.fixedScale
  };
};