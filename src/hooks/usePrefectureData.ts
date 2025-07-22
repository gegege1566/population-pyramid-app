import { useState, useEffect, useCallback } from 'react';
import { PopulationData } from '../types/population';
import { LocalDataService } from '../services/localDataService';

const localDataService = new LocalDataService();

interface PrefectureDataState {
  data: { [year: number]: PopulationData[] };
  loading: boolean;
  preloading: boolean;
  error: string | null;
  currentPrefCode: string | null;
  fixedScale: number | null; // 2025年ベースの固定スケール
}

export const usePrefectureData = () => {
  const [state, setState] = useState<PrefectureDataState>({
    data: {},
    loading: false,
    preloading: false,
    error: null,
    currentPrefCode: null,
    fixedScale: null
  });

  const loadPrefectureData = useCallback(async (prefCode: string, availableYears: number[]) => {
    if (!prefCode || availableYears.length === 0) return;

    // 同じ都道府県の場合は何もしない
    if (state.currentPrefCode === prefCode && Object.keys(state.data).length === availableYears.length) {
      return;
    }

    console.log(`Loading all data for prefecture ${prefCode}...`);

    setState(prev => ({
      ...prev,
      loading: true,
      preloading: true,
      error: null,
      currentPrefCode: prefCode
    }));

    try {
      // 全年度のデータを並列取得
      const dataPromises = availableYears.map(async (year) => {
        const data = await localDataService.getPopulationData(prefCode, year);
        return { year, data };
      });

      const results = await Promise.all(dataPromises);
      
      // データをオブジェクトに整理
      const dataByYear: { [year: number]: PopulationData[] } = {};
      results.forEach(({ year, data }) => {
        dataByYear[year] = data;
      });

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
        preloading: false,
        error: null,
        fixedScale: fixedScale
      }));

      console.log(`✅ All data loaded for ${prefCode}. Years: ${availableYears.join(', ')}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        preloading: false,
        error: errorMessage
      }));
      console.error('Failed to load prefecture data:', error);
    }
  }, [state.currentPrefCode, state.data]);

  const getDataForYear = useCallback((year: number): PopulationData[] => {
    return state.data[year] || [];
  }, [state.data]);

  const isDataAvailable = useCallback((year: number): boolean => {
    return state.data[year] !== undefined;
  }, [state.data]);

  return {
    loadPrefectureData,
    getDataForYear,
    isDataAvailable,
    loading: state.loading,
    preloading: state.preloading,
    error: state.error,
    currentPrefCode: state.currentPrefCode,
    fixedScale: state.fixedScale
  };
};