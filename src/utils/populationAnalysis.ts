import { PopulationData, PopulationStats } from '../types/population';

export interface PyramidData {
  ageGroups: string[];
  maleData: number[];
  femaleData: number[];
}

export const createPopulationPyramid = (data: PopulationData[]): PyramidData => {
  const pyramid: PyramidData = {
    ageGroups: [],
    maleData: [],
    femaleData: []
  };
  
  // デバッグ: 利用可能な年齢階級をログ出力
  const allAgeGroups = Array.from(new Set(data.map(d => d.ageGroup)));
  console.log('Available age groups:', allAgeGroups);
  console.log('Total data records:', data.length);
  
  // 95-99歳のデータが含まれているか確認
  const has9599 = data.some(d => d.ageGroup === '95-99');
  console.log('Has 95-99 age group:', has9599);
  if (has9599) {
    const data9599 = data.filter(d => d.ageGroup === '95-99');
    console.log('95-99 age group data:', data9599);
  }
  
  // 年齢階級でグループ化（高齢者を上に表示するため降順）
  const ageGroups = allAgeGroups.sort((a, b) => {
    // 年齢順にソート（降順）
    if (a === '85+') return -1;
    if (b === '85+') return 1;
    if (a === '100歳以上' || a === '100+') return -1;
    if (b === '100歳以上' || b === '100+') return 1;
    
    // 通常の年齢階級のソート（例: "0-4", "5-9", ..., "95-99"）
    const aStart = parseInt(a.split('-')[0]);
    const bStart = parseInt(b.split('-')[0]);
    
    // NaNチェック（パースできない場合）
    if (isNaN(aStart) || isNaN(bStart)) {
      console.warn(`Invalid age group format: ${isNaN(aStart) ? a : b}`);
      return 0;
    }
    
    return bStart - aStart;
  });
  
  ageGroups.forEach(ageGroup => {
    const malePopulation = data.find(d => d.ageGroup === ageGroup && d.gender === 'male')?.population || 0;
    const femalePopulation = data.find(d => d.ageGroup === ageGroup && d.gender === 'female')?.population || 0;
    
    // デバッグ: 全年齢のデータをログ出力
    console.log(`🔍 Pyramid data - ${ageGroup}: male=${malePopulation}, female=${femalePopulation}`);
    
    // 全国・都道府県データ共に既に千人単位で統一済み
    const maleScale = malePopulation;
    const femaleScale = femalePopulation;
    
    pyramid.ageGroups.push(ageGroup);
    pyramid.maleData.push(-maleScale); // 左側表示のため負の値
    pyramid.femaleData.push(femaleScale);
  });
  
  return pyramid;
};

export const calculateStats = (data: PopulationData[]): PopulationStats => {
  const totalPopulation = data.reduce((sum, d) => sum + d.population, 0);
  const malePopulation = data.filter(d => d.gender === 'male').reduce((sum, d) => sum + d.population, 0);
  const femalePopulation = data.filter(d => d.gender === 'female').reduce((sum, d) => sum + d.population, 0);
  
  // 年齢層別統計
  const under15 = data.filter(d => {
    const ageStart = parseInt(d.ageGroup.split('-')[0]);
    return ageStart < 15;
  }).reduce((sum, d) => sum + d.population, 0);
  
  const working = data.filter(d => {
    const ageStart = parseInt(d.ageGroup.split('-')[0]);
    return ageStart >= 15 && ageStart < 65;
  }).reduce((sum, d) => sum + d.population, 0);
  
  const elderly = data.filter(d => {
    if (d.ageGroup === '85+') return true;
    if (d.ageGroup === '100歳以上' || d.ageGroup === '100+') return true;
    const ageStart = parseInt(d.ageGroup.split('-')[0]);
    // 65歳以上（95-99歳も含む）
    return !isNaN(ageStart) && ageStart >= 65;
  }).reduce((sum, d) => sum + d.population, 0);
  
  return {
    totalPopulation,
    malePopulation,
    femalePopulation,
    genderRatio: femalePopulation > 0 ? parseFloat((malePopulation / femalePopulation * 100).toFixed(2)) : 0,
    under15Ratio: totalPopulation > 0 ? parseFloat((under15 / totalPopulation * 100).toFixed(2)) : 0,
    workingRatio: totalPopulation > 0 ? parseFloat((working / totalPopulation * 100).toFixed(2)) : 0,
    elderlyRatio: totalPopulation > 0 ? parseFloat((elderly / totalPopulation * 100).toFixed(2)) : 0,
    dependencyRatio: working > 0 ? parseFloat(((under15 + elderly) / working * 100).toFixed(2)) : 0
  };
};

export const analyzePopulationTrend = (timeSeriesData: { [year: number]: PopulationData[] }) => {
  const years = Object.keys(timeSeriesData).map(Number).sort();
  
  const totalPopulationByYear = years.map(year => {
    const total = timeSeriesData[year].reduce((sum, d) => sum + d.population, 0);
    return { year, population: total };
  });
  
  // 成長率計算
  const growthRates = totalPopulationByYear.slice(1).map((current, index) => {
    const previous = totalPopulationByYear[index];
    const rate = ((current.population - previous.population) / previous.population * 100);
    return { year: current.year, growthRate: rate };
  });
  
  // トレンド分析
  const averageGrowth = growthRates.length > 0 
    ? growthRates.reduce((sum, d) => sum + d.growthRate, 0) / growthRates.length 
    : 0;
  const isGrowing = averageGrowth > 0;
  
  const volatility = growthRates.length > 0 
    ? Math.sqrt(growthRates.reduce((sum, d) => sum + Math.pow(d.growthRate - averageGrowth, 2), 0) / growthRates.length)
    : 0;
  
  return {
    timeSeriesData: totalPopulationByYear,
    growthRates,
    averageGrowth: parseFloat(averageGrowth.toFixed(3)),
    isGrowing,
    volatility: parseFloat(volatility.toFixed(3))
  };
};

export const generateForecast = (historicalData: { year: number; population: number }[], forecastYears: number = 5) => {
  if (historicalData.length < 2) return [];
  
  // 線形回帰による簡易予測
  const n = historicalData.length;
  
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.population);
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return Array.from({ length: forecastYears }, (_, i) => {
    const xVal = n + i;
    const year = historicalData[n - 1].year + i + 1;
    const population = Math.round(slope * xVal + intercept);
    return { 
      year, 
      population: Math.max(0, population), // 負の値は0にクリップ
      forecast: true 
    };
  });
};

export const comparePopulations = (data1: PopulationData[], data2: PopulationData[], label1: string, label2: string) => {
  const stats1 = calculateStats(data1);
  const stats2 = calculateStats(data2);
  
  return {
    comparison: {
      [label1]: stats1,
      [label2]: stats2
    },
    differences: {
      totalPopulation: stats2.totalPopulation - stats1.totalPopulation,
      elderlyRatio: stats2.elderlyRatio - stats1.elderlyRatio,
      workingRatio: stats2.workingRatio - stats1.workingRatio,
      under15Ratio: stats2.under15Ratio - stats1.under15Ratio
    },
    percentageChanges: {
      totalPopulation: stats1.totalPopulation > 0 
        ? ((stats2.totalPopulation - stats1.totalPopulation) / stats1.totalPopulation * 100)
        : 0,
      elderlyRatio: stats2.elderlyRatio - stats1.elderlyRatio,
      workingRatio: stats2.workingRatio - stats1.workingRatio
    }
  };
};