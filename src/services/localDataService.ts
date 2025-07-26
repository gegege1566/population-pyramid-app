import { PopulationData } from '../types/population';
import { UnifiedEStatService } from './unifiedEstatApi';

// API専用データサービス（ローカルファイル参照を廃止）
export class LocalDataService {
  private apiService = new UnifiedEStatService();
  private cache = new Map<string, PopulationData[]>();
  
  async getPopulationData(prefCode: string, year: number): Promise<PopulationData[]> {
    const cacheKey = `${prefCode}-${year}`;
    
    // キャッシュから取得を試行
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // APIから直接取得（ローカルファイル参照を廃止）
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
    console.log('🚀 Starting API-only data preload...');
    
    try {
      const availableYears = await this.getAllAvailableYears();
      console.log(`📅 Available years: ${availableYears.join(', ')}`);
      
      // 全国データを優先的にプリロード
      for (const year of availableYears) {
        try {
          await this.getPopulationData('00000', year);
          console.log(`✅ Preloaded national data for ${year}`);
        } catch (error) {
          console.warn(`⚠️ Failed to preload national data for ${year}:`, error);
        }
      }
      
      console.log(`✅ API-only preload completed. Cache size: ${this.cache.size}`);
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }

  async preloadPrefectureData(prefCode: string): Promise<void> {
    console.log(`📡 API-based preloading for prefecture ${prefCode}...`);
    
    try {
      const availableYears = await this.getAllAvailableYears();
      console.log(`📅 Years to preload: ${availableYears.join(', ')}`);
      
      // APIレート制限対応：順次処理で3秒間隔
      for (const year of availableYears) {
        try {
          await this.getPopulationData(prefCode, year);
          console.log(`✅ Preloaded ${prefCode}-${year}`);
          
          // API制限回避のため3秒待機
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.warn(`⚠️ Failed to preload ${prefCode}-${year}:`, error);
          // エラー時は5秒待機してから次へ
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      console.log(`✅ Prefecture preloading completed for ${prefCode}. Cache size: ${this.cache.size}`);
      
    } catch (error) {
      console.error(`❌ Failed to preload data for ${prefCode}:`, error);
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
    
    // データのサンプルをログ出力
    const sample = data.slice(0, 3);
    console.log(`🔍 Scale calculation sample data:`, sample.map(r => `${r.ageGroup} ${r.gender}: ${r.population}`));
    
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