import { useState, useEffect } from 'react';
import { PopulationData } from '../types/population';
import { LocalDataService } from '../services/localDataService';

const localDataService = new LocalDataService();

export const usePopulationData = (prefCode: string, year: number) => {
  const [data, setData] = useState<PopulationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!prefCode || !year) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching data for prefecture ${prefCode}, year ${year}`);
        const result = await localDataService.getPopulationData(prefCode, year);
        console.log(`Received ${result.length} data points for ${prefCode}-${year}`);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Population data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prefCode, year]);

  return { data, loading, error };
};

export const useTimeSeriesData = (prefCode: string, years: number[]) => {
  const [data, setData] = useState<{ [year: number]: PopulationData[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!prefCode || years.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const result = await localDataService.getTimeSeriesData(prefCode, years);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Time series data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prefCode, years]);

  return { data, loading, error };
};

export const useAvailableYears = () => {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const availableYears = await localDataService.getAllAvailableYears();
        setYears(availableYears);
      } catch (err) {
        console.error('Failed to fetch available years:', err);
        setYears([2020]); // フォールバック
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []);

  return { years, loading };
};