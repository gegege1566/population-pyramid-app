import axios from 'axios';
import { PopulationData, ApiResponse } from '../types/population';
import { PREFECTURE_CODES, TIME_CODES, AGE_GROUP_CODES } from '../data/prefectures';

const API_KEY = process.env.REACT_APP_ESTAT_API_KEY || '';
const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app';

export class EStatService {
  private cache = new Map<string, PopulationData[]>();
  
  async getPopulationData(prefCode: string, year: number): Promise<PopulationData[]> {
    const cacheKey = `${prefCode}-${year}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      const response = await axios.get<ApiResponse>(`${BASE_URL}/json/getStatsData`, {
        params: {
          appId: API_KEY,
          statsDataId: '0003448237',
          metaGetFlg: 'Y',
          cntGetFlg: 'N',
          cdCat01: '001,002',
          cdCat03: '001',
          cdArea: `${prefCode}000`,
          cdTime: this.getTimeCode(year),
          limit: 500
        },
        timeout: 20000
      });
      
      this.validateApiResponse(response.data);
      const data = this.transformData(response.data, prefCode, year);
      this.cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error(`API Error for ${prefCode}-${year}:`, error);
      throw error;
    }
  }
  
  private validateApiResponse(response: ApiResponse): void {
    if (!response?.GET_STATS_DATA?.RESULT) {
      throw new Error('Invalid API response structure');
    }
    
    const result = response.GET_STATS_DATA.RESULT;
    if (result.STATUS !== 0) {
      throw new Error(`API Error: ${result.ERROR_MSG || 'Unknown error'}`);
    }
  }
  
  private getTimeCode(year: number): string {
    return TIME_CODES[year] || '1601';
  }
  
  private transformData(apiResponse: ApiResponse, prefCode: string, year: number): PopulationData[] {
    const values = apiResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    const classInfo = apiResponse.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ || [];
    
    const genderMapping = this.buildMapping(classInfo, '男女別');
    const ageMapping = this.buildMapping(classInfo, '年齢5歳階級');
    
    return values
      .map(value => ({
        year: year,
        prefecture: this.getPrefectureName(prefCode),
        prefectureCode: prefCode,
        ageGroup: this.convertAgeCode(value['@cat02'], ageMapping[value['@cat02']]),
        gender: value['@cat01'] === '001' ? 'male' as const : 'female' as const,
        population: parseInt(value['$'] || '0', 10)
      }))
      .filter(item => item.population > 0 && item.ageGroup !== 'unknown');
  }
  
  private buildMapping(classInfo: any[], keyword: string): { [key: string]: string } {
    const targetClass = classInfo.find(c => c['@name'].includes(keyword));
    const mapping: { [key: string]: string } = {};
    
    if (targetClass?.CLASS) {
      const items = Array.isArray(targetClass.CLASS) ? targetClass.CLASS : [targetClass.CLASS];
      items.forEach((item: any) => {
        mapping[item['@code']] = item['@name'];
      });
    }
    
    return mapping;
  }
  
  private getPrefectureName(code: string): string {
    return PREFECTURE_CODES[code] || '不明';
  }
  
  private convertAgeCode(code: string, name?: string): string {
    if (!name) return 'unknown';
    
    if (name.includes('85歳以上')) return '85+';
    
    const match = name.match(/(\d+)～(\d+)歳/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return 'unknown';
  }
  
  async getAllPrefecturesData(year: number): Promise<{ [prefCode: string]: PopulationData[] }> {
    const results: { [prefCode: string]: PopulationData[] } = {};
    const prefCodes = Object.keys(PREFECTURE_CODES);
    
    for (const prefCode of prefCodes) {
      try {
        console.log(`Fetching data for ${PREFECTURE_CODES[prefCode]} (${prefCode}) - ${year}`);
        results[prefCode] = await this.getPopulationData(prefCode, year);
        
        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch data for ${prefCode}:`, error);
        results[prefCode] = [];
      }
    }
    
    return results;
  }
  
  async getTimeSeriesData(prefCode: string, years: number[]): Promise<{ [year: number]: PopulationData[] }> {
    const results: { [year: number]: PopulationData[] } = {};
    
    for (const year of years) {
      try {
        console.log(`Fetching time series data for ${this.getPrefectureName(prefCode)} - ${year}`);
        results[year] = await this.getPopulationData(prefCode, year);
        
        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch data for ${prefCode}-${year}:`, error);
        results[year] = [];
      }
    }
    
    return results;
  }
}