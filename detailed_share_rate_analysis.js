#!/usr/bin/env node

// Detailed analysis of Aomori Prefecture coop member share rates
// This script calculates what the 2025 base rates should be and verifies consistency

console.log('DETAILED AOMORI PREFECTURE COOP MEMBER SHARE RATE ANALYSIS');
console.log('===========================================================');
console.log('');

// All data for Aomori Prefecture (code 02)
const data = {
  population: {
    2025: { "20-24": 61, "25-29": 60, "30-34": 50 },
    2030: { "20-24": 58, "25-29": 54, "30-34": 52 },
    2035: { "20-24": 55, "25-29": 52, "30-34": 57 },
    2040: { "20-24": 48, "25-29": 59, "30-34": 54 },
    2045: { "20-24": 50, "25-29": 42, "30-34": 52 },
    2050: { "20-24": 47, "25-29": 41, "30-34": 51 }
  },
  coopMembers: {
    // Note: No 2025 data available in projection files
    2030: { "20-24": 1.0, "25-29": 1.1, "30-34": 6.6 },
    2035: { "20-24": 1.0, "25-29": 1.0, "30-34": 7.3 },
    2040: { "20-24": 0.8, "25-29": 1.2, "30-34": 6.9 },
    2045: { "20-24": 0.9, "25-29": 0.8, "30-34": 6.6 },
    2050: { "20-24": 0.8, "25-29": 0.8, "30-34": 6.5 }
  }
};

// Calculate share rates for all available years
const shareRates = {};
const years = ['2030', '2035', '2040', '2045', '2050'];
const ageGroups = ['20-24', '25-29', '30-34'];

console.log('1. CALCULATED SHARE RATES:');
console.log('===========================');
console.log('Year    | 20-24 Age Group | 25-29 Age Group | 30-34 Age Group');
console.log('        | Pop  Coop  Rate | Pop  Coop  Rate | Pop  Coop   Rate');
console.log('--------|-----------------|-----------------|------------------');

years.forEach(year => {
  if (!shareRates[year]) shareRates[year] = {};
  
  const rowData = [];
  ageGroups.forEach(ageGroup => {
    const pop = data.population[year][ageGroup];
    const coop = data.coopMembers[year][ageGroup];
    const rate = (coop / pop * 100);
    
    shareRates[year][ageGroup] = rate;
    rowData.push({ pop, coop, rate });
  });
  
  console.log(`${year}    | ${rowData[0].pop.toString().padStart(3)} ${rowData[0].coop.toString().padStart(4)} ${rowData[0].rate.toFixed(2).padStart(5)}% | ${rowData[1].pop.toString().padStart(3)} ${rowData[1].coop.toString().padStart(4)} ${rowData[1].rate.toFixed(2).padStart(5)}% | ${rowData[2].pop.toString().padStart(3)} ${rowData[2].coop.toString().padStart(4)} ${rowData[2].rate.toFixed(1).padStart(6)}%`);
});

console.log('');
console.log('2. CONSISTENCY ANALYSIS:');
console.log('=========================');

// Calculate statistics for each age group
ageGroups.forEach(ageGroup => {
  console.log(`\n${ageGroup} Age Group Analysis:`);
  
  const rates = years.map(year => shareRates[year][ageGroup]);
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min;
  const standardDeviation = Math.sqrt(rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length);
  
  console.log(`  Share rates across years: ${rates.map(r => r.toFixed(3) + '%').join(', ')}`);
  console.log(`  Mean: ${mean.toFixed(3)}%`);
  console.log(`  Range: ${min.toFixed(3)}% - ${max.toFixed(3)}% (${range.toFixed(3)}% variation)`);
  console.log(`  Standard deviation: ${standardDeviation.toFixed(3)}%`);
  
  // Check for significant variations
  const significantVariations = years.filter(year => 
    Math.abs(shareRates[year][ageGroup] - mean) > 1.0
  );
  
  if (significantVariations.length > 0) {
    console.log(`  ⚠️  Years with >1% deviation from mean: ${significantVariations.join(', ')}`);
  } else {
    console.log(`  ✅ All variations within 1% of mean`);
  }
  
  // Year-over-year changes
  console.log(`  Year-over-year changes:`);
  for (let i = 1; i < years.length; i++) {
    const prevYear = years[i-1];
    const currYear = years[i];
    const change = shareRates[currYear][ageGroup] - shareRates[prevYear][ageGroup];
    console.log(`    ${prevYear} → ${currYear}: ${change > 0 ? '+' : ''}${change.toFixed(3)}%`);
  }
});

console.log('');
console.log('3. REVERSE CALCULATION - ESTIMATED 2025 BASE RATES:');
console.log('====================================================');
console.log('If the system maintains consistent share rates, the 2025 base rates would be:');

ageGroups.forEach(ageGroup => {
  const avgRate = years.reduce((sum, year) => sum + shareRates[year][ageGroup], 0) / years.length;
  const pop2025 = data.population['2025'][ageGroup];
  const estimatedCoopMembers2025 = (avgRate / 100) * pop2025;
  
  console.log(`\n${ageGroup} Age Group:`);
  console.log(`  2025 Population: ${pop2025}`);
  console.log(`  Average rate 2030-2050: ${avgRate.toFixed(3)}%`);
  console.log(`  Estimated 2025 coop members: ${estimatedCoopMembers2025.toFixed(1)}`);
  console.log(`  This gives a 2025 share rate of: ${(estimatedCoopMembers2025/pop2025*100).toFixed(3)}%`);
});

console.log('');
console.log('4. VALIDATION SUMMARY:');
console.log('======================');

let allConsistent = true;
const maxAllowedVariation = 1.0; // 1%

ageGroups.forEach(ageGroup => {
  const rates = years.map(year => shareRates[year][ageGroup]);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min;
  
  console.log(`\n${ageGroup}: Range ${range.toFixed(3)}% ${range <= maxAllowedVariation ? '✅ PASS' : '❌ FAIL'}`);
  
  if (range > maxAllowedVariation) {
    allConsistent = false;
  }
});

console.log(`\nOVERALL RESULT: ${allConsistent ? '✅ PASS' : '❌ FAIL'}`);

if (allConsistent) {
  console.log('\nThe coop member projection data for Aomori Prefecture successfully');
  console.log('maintains consistent share rates for young age groups (20-24, 25-29, 30-34)');
  console.log('across the projection period 2030-2050, with all variations under 1%.');
} else {
  console.log('\nThe coop member projection data for Aomori Prefecture does NOT maintain');
  console.log('consistent share rates for young age groups, with variations exceeding 1%.');
}

console.log('\nNote: This analysis is based on the available projection data starting from 2030.');
console.log('No 2025 coop member baseline data was found in the projection files.');