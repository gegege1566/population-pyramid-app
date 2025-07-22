export interface PopulationData {
  year: number;
  prefecture: string;
  prefectureCode: string;
  ageGroup: string;
  gender: 'male' | 'female';
  population: number;
}

export interface PrefectureInfo {
  code: string;
  name: string;
  region: string;
}

export interface PopulationStats {
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  genderRatio: number;
  under15Ratio: number;
  workingRatio: number;
  elderlyRatio: number;
  dependencyRatio: number;
}

export interface ApiResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG?: string;
    };
    STATISTICAL_DATA?: {
      DATA_INF?: {
        VALUE?: Array<{
          $: string;
          '@cat01': string;
          '@cat02': string;
          '@area': string;
          '@time': string;
        }>;
      };
      CLASS_INF?: {
        CLASS_OBJ?: Array<{
          '@name': string;
          CLASS: Array<{
            '@code': string;
            '@name': string;
          }> | {
            '@code': string;
            '@name': string;
          };
        }>;
      };
    };
  };
}