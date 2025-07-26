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
    
    // まずAPIデータから取得を試行（優先）
    try {
      const apiData = await this.loadFromApiData(prefCode, year);
      if (apiData && apiData.length > 0) {
        this.cache.set(cacheKey, apiData);
        console.log(`Loaded data from API files for ${prefCode}-${year}: ${apiData.length} records`);
        return apiData;
      }
    } catch (error) {
      console.warn(`Failed to load data from API files for ${prefCode}-${year}:`, error);
    }
    
    // フォールバック: 統一APIから直接取得
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

  private async loadFromApiData(prefCode: string, year: number): Promise<PopulationData[]> {
    try {
      if (prefCode === '00000') {
        // 全国データ
        const response = await fetch(`/data/population/population_national_${year}.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`✅ Loaded national API data for ${year}: ${data.length} records`);
        
        // 全国データを千人単位に変換（JSONファイルに実人数が格納されているため）
        const convertedData = Array.isArray(data) ? data.map(record => ({
          ...record,
          population: Math.round(record.population / 1000) // 実人数 → 千人単位
        })) : [];
        
        return convertedData;
      } else {
        // 都道府県データ
        const response = await fetch(`/data/population/population_${year}.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const allData = await response.json();
        const prefData = allData[prefCode] || [];
        console.log(`✅ Loaded prefecture API data for ${prefCode}-${year}: ${prefData.length} records`);
        
        // 都道府県データは既に千人単位で保存されているのでそのまま返す
        return prefData;
      }
    } catch (error) {
      console.warn(`Could not load API data file for ${prefCode}-${year}:`, error);
      return [];
    }
  }

  private async loadNationalDataFromFile(year: number): Promise<PopulationData[]> {
    try {
      const response = await fetch(`/data/population/population_national_${year}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Could not load national data file for ${year}:`, error);
      return [];
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
    console.log('Preloading disabled - using API-only mode');
    // API連携のみではプリロードを行わない（リクエスト時にキャッシュされる）
  }

  async preloadPrefectureData(prefCode: string): Promise<void> {
    console.log(`Preloading all years data for prefecture ${prefCode}...`);
    
    try {
      const availableYears = await this.getAllAvailableYears();
      
      // 並列でデータ取得（ただしレート制限を考慮して少し遅延）
      const promises = availableYears.map((year, index) => 
        new Promise<void>(async (resolve) => {
          try {
            // 順次処理でレート制限回避
            await new Promise(r => setTimeout(r, index * 200));
            await this.getPopulationData(prefCode, year);
            console.log(`✓ Preloaded ${prefCode}-${year}`);
          } catch (error) {
            console.warn(`⚠ Failed to preload ${prefCode}-${year}:`, error);
          }
          resolve();
        })
      );
      
      await Promise.all(promises);
      console.log(`✅ Preloading completed for ${prefCode}. Cache size: ${this.cache.size}`);
      
    } catch (error) {
      console.error(`Failed to preload data for ${prefCode}:`, error);
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
    console.log(`Calculating dynamic scale for current data...`);
    
    if (!data || data.length === 0) {
      return 250; // デフォルト値
    }
    
    // 人口ピラミッド用: 男性・女性それぞれの最大値を計算
    // （男女合計ではなく、個別の性別での最大値を使用）
    let maxPopulation = 0;
    
    for (const record of data) {
      if (record.population > maxPopulation) {
        maxPopulation = record.population;
      }
    }
    
    // 全国・都道府県データ統一後のスケール計算
    let scale: number;
    
    if (maxPopulation <= 50) {
      // 小規模都道府県: 10千人単位、余裕20%
      scale = Math.ceil(maxPopulation * 1.2 / 10) * 10;
    } else if (maxPopulation <= 200) {
      // 中規模都道府県: 20千人単位、余裕15%
      scale = Math.ceil(maxPopulation * 1.15 / 20) * 20;
    } else if (maxPopulation <= 500) {
      // 大規模都道府県: 50千人単位、余裕10%
      scale = Math.ceil(maxPopulation * 1.1 / 50) * 50;
    } else if (maxPopulation <= 2000) {
      // 全国規模小: 200千人単位、余裕10%
      scale = Math.ceil(maxPopulation * 1.1 / 200) * 200;
    } else if (maxPopulation <= 5000) {
      // 全国規模中: 500千人単位、余裕10%
      scale = Math.ceil(maxPopulation * 1.1 / 500) * 500;
    } else {
      // 全国規模大: 1000千人単位、余裕10%
      scale = Math.ceil(maxPopulation * 1.1 / 1000) * 1000;
    }
    
    console.log(`Dynamic scale calculated: ${scale} (max population: ${maxPopulation} thousand people)`);
    return Math.max(scale, 15); // 最低15千人
  }

  async calculatePrefectureMaxScale(prefCode: string): Promise<number> {
    console.log(`Calculating max scale for prefecture ${prefCode}...`);
    
    try {
      const availableYears = await this.getAllAvailableYears();
      let maxPopulation = 0;
      
      // 全年度のデータを取得して最大値を計算（エリア別固定スケール用）
      for (const year of availableYears) {
        const data = await this.getPopulationData(prefCode, year);
        for (const record of data) {
          if (record.population > maxPopulation) {
            maxPopulation = record.population;
          }
        }
      }
      
      // 実データ分析結果を基にした最適化されたスケール計算
      // 分析結果: 最小11千人(鳥取県) 〜 最大503千人(東京都)
      let scale: number;
      
      if (maxPopulation <= 30) {
        // 小規模（鳥取県〜佐賀県レベル）: 〜30千人
        scale = Math.ceil(maxPopulation * 1.15 / 5) * 5; // 5千人単位、余裕15%
      } else if (maxPopulation <= 80) {
        // 中小規模（群馬県〜広島県レベル）: 30〜80千人
        scale = Math.ceil(maxPopulation * 1.1 / 10) * 10; // 10千人単位、余裕10%
      } else if (maxPopulation <= 200) {
        // 中規模（静岡県〜埼玉県レベル）: 80〜200千人  
        scale = Math.ceil(maxPopulation * 1.08 / 20) * 20; // 20千人単位、余裕8%
      } else if (maxPopulation <= 300) {
        // 大規模（神奈川県〜愛知県レベル）: 200〜300千人
        scale = Math.ceil(maxPopulation * 1.05 / 30) * 30; // 30千人単位、余裕5%
      } else {
        // 特大規模（東京都レベル）: 300千人超
        scale = Math.ceil(maxPopulation * 1.05 / 50) * 50; // 50千人単位、余裕5%
      }
      
      console.log(`Max scale for ${prefCode}: ${scale} (max population: ${maxPopulation})`);
      return Math.max(scale, 15); // 最低15千人
      
    } catch (error) {
      console.error(`Failed to calculate max scale for ${prefCode}:`, error);
      return 250; // デフォルト値（中規模都道府県想定）
    }
  }
}