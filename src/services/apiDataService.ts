import { PopulationData } from '../types/population';
import { UnifiedEStatService } from './unifiedEstatApi';

// API専用データサービス（ローカルファイル参照を完全に廃止）
export class ApiDataService {
  private apiService = new UnifiedEStatService();
  private cache = new Map<string, PopulationData[]>();
  
  async getPopulationData(prefCode: string, year: number): Promise<PopulationData[]> {
    const cacheKey = `${prefCode}-${year}`;
    
    // キャッシュから取得を試行
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // APIから直接取得
    try {
      const apiData = await this.apiService.getPopulationData(prefCode, year);
      if (apiData && apiData.length > 0) {
        this.cache.set(cacheKey, apiData);
        return apiData;
      } else {
        console.warn(`⚠️ No data: ${prefCode}-${year}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ API error: ${prefCode}-${year}`, error);
      throw error;
    }
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
    try {
      const availableYears = await this.getAllAvailableYears();
      
      // 全国データを優先的にプリロード
      for (const year of availableYears) {
        try {
          await this.getPopulationData('00000', year);
        } catch (error) {
          console.warn(`⚠️ Preload failed: ${year}`);
        }
      }
    } catch (error) {
      console.error('❌ Preload error:', error);
    }
  }

  async preloadPrefectureData(prefCode: string): Promise<void> {
    try {
      const availableYears = await this.getAllAvailableYears();
      
      // APIレート制限対応：順次処理で3秒間隔
      for (const year of availableYears) {
        try {
          await this.getPopulationData(prefCode, year);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.warn(`⚠️ Preload failed: ${prefCode}-${year}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error(`❌ Preload error: ${prefCode}`, error);
    }
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

  calculateDynamicScale(data: PopulationData[]): number {
    if (!data || data.length === 0) {
      return 250;
    }
    
    let maxPopulation = 0;
    for (const record of data) {
      if (record.population > maxPopulation) {
        maxPopulation = record.population;
      }
    }
    
    let scale: number;
    if (maxPopulation <= 50) {
      scale = Math.ceil(maxPopulation * 1.2 / 10) * 10;
    } else if (maxPopulation <= 200) {
      scale = Math.ceil(maxPopulation * 1.15 / 20) * 20;
    } else if (maxPopulation <= 500) {
      scale = Math.ceil(maxPopulation * 1.1 / 50) * 50;
    } else if (maxPopulation <= 2000) {
      scale = Math.ceil(maxPopulation * 1.1 / 200) * 200;
    } else if (maxPopulation <= 5000) {
      scale = Math.ceil(maxPopulation * 1.1 / 500) * 500;
    } else {
      scale = Math.ceil(maxPopulation * 1.1 / 1000) * 1000;
    }
    
    return Math.max(scale, 15);
  }

  async calculatePrefectureMaxScale(prefCode: string): Promise<number> {
    try {
      const availableYears = await this.getAllAvailableYears();
      let maxPopulation = 0;
      
      for (const year of availableYears) {
        const data = await this.getPopulationData(prefCode, year);
        for (const record of data) {
          if (record.population > maxPopulation) {
            maxPopulation = record.population;
          }
        }
      }
      
      let scale: number;
      if (maxPopulation <= 30) {
        scale = Math.ceil(maxPopulation * 1.15 / 5) * 5;
      } else if (maxPopulation <= 80) {
        scale = Math.ceil(maxPopulation * 1.1 / 10) * 10;
      } else if (maxPopulation <= 200) {
        scale = Math.ceil(maxPopulation * 1.08 / 20) * 20;
      } else if (maxPopulation <= 300) {
        scale = Math.ceil(maxPopulation * 1.05 / 30) * 30;
      } else {
        scale = Math.ceil(maxPopulation * 1.05 / 50) * 50;
      }
      
      return Math.max(scale, 15);
      
    } catch (error) {
      console.error(`❌ Scale calculation error: ${prefCode}`, error);
      return 250;
    }
  }
}