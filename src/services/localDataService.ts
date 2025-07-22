import { PopulationData } from '../types/population';
import { UnifiedEStatService } from './unifiedEstatApi';

export class LocalDataService {
  private apiService = new UnifiedEStatService();
  private cache = new Map<string, PopulationData[]>();
  
  async getPopulationData(prefCode: string, year: number): Promise<PopulationData[]> {
    const cacheKey = `${prefCode}-${year}`;
    
    // キャッシュから取得を試行
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 統一APIから取得
    try {
      console.log(`Fetching data from API for ${prefCode}-${year}`);
      const apiData = await this.apiService.getPopulationData(prefCode, year);
      if (apiData && apiData.length > 0) {
        this.cache.set(cacheKey, apiData);
        return apiData;
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${prefCode}-${year}:`, error);
      throw error; // エラーを上位に伝播
    }
    
    // データが空の場合
    return [];
  }
  
  async getAllAvailableYears(): Promise<number[]> {
    // 統一APIから利用可能年度を取得
    return await this.apiService.getAvailableYears();
  }
  
  async getTimeSeriesData(prefCode: string, years: number[]): Promise<{ [year: number]: PopulationData[] }> {
    const results: { [year: number]: PopulationData[] } = {};
    
    for (const year of years) {
      results[year] = await this.getPopulationData(prefCode, year);
    }
    
    return results;
  }
  
  async preloadAllData(): Promise<void> {
    console.log('Preloading disabled - using API-only mode');
    // API連携のみではプリロードを行わない（リクエスト時にキャッシュされる）
  }
  
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
  
  clearCache(): void {
    this.cache.clear();
    this.apiService.clearCache();
  }
}