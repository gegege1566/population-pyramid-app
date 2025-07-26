import { useState, useCallback } from 'react';
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

// 高速化された複数都道府県データ合算関数
const mergePopulationData = (dataArrays: PopulationData[][]): PopulationData[] => {
  if (dataArrays.length === 0) return [];
  if (dataArrays.length === 1) return dataArrays[0];

  const mergedMap = new Map<string, number>();
  let sampleItem: PopulationData | null = null;

  // 高速合算処理
  for (const data of dataArrays) {
    for (const item of data) {
      if (!sampleItem) sampleItem = item;
      
      const key = `${item.ageGroup}_${item.gender}`;
      const current = mergedMap.get(key) || 0;
      mergedMap.set(key, current + item.population);
    }
  }

  if (!sampleItem) return [];

  // 結果の構築（ソート最適化）
  const ageGroups = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', 
                    '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', 
                    '75-79', '80-84', '85-89', '90-94', '95-99'];
  const genders = ['male', 'female'];

  const result: PopulationData[] = [];
  for (const ageGroup of ageGroups) {
    for (const gender of genders) {
      const key = `${ageGroup}_${gender}`;
      const population = mergedMap.get(key);
      if (population !== undefined) {
        result.push({
          year: sampleItem.year,
          prefecture: 'Multiple Areas',
          prefectureCode: 'MULTI',
          ageGroup,
          gender: gender as 'male' | 'female',
          population
        });
      }
    }
  }

  return result;
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

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      currentPrefCodes: [...prefCodes]
    }));

    try {
      // 全年度・全都道府県を並列取得（大幅高速化）
      const allDataPromises = availableYears.flatMap(year =>
        prefCodes.map(async prefCode => ({
          year,
          prefCode,
          data: await localDataService.getPopulationData(prefCode, year)
        }))
      );
      
      const allResults = await Promise.all(allDataPromises);
      
      // 年度別にデータを整理・合算（最適化版）
      const dataByYear: { [year: number]: PopulationData[] } = {};
      const dataByYearMap = new Map<number, PopulationData[][]>();
      
      // 年度別にグループ化
      for (const { year, data } of allResults) {
        if (!dataByYearMap.has(year)) {
          dataByYearMap.set(year, []);
        }
        dataByYearMap.get(year)!.push(data);
      }
      
      // 各年度でデータを合算
      dataByYearMap.forEach((prefDataArrays, year) => {
        dataByYear[year] = mergePopulationData(prefDataArrays);
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
        error: null,
        fixedScale: fixedScale
      }));

      console.log(`✅ ${prefCodes.length} prefectures loaded (${allResults.length} total requests)`);

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