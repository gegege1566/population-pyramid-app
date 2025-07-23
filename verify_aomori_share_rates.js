#!/usr/bin/env node

// Script to verify coop member share rates for Aomori Prefecture (code 02)
// Focus on young age groups: 20-24, 25-29, 30-34 across years 2030-2050

// Data extracted from files
const populationData = {
  2025: {
    "20-24": { male: 29, female: 32 }, // Total: 61
    "25-29": { male: 29, female: 31 }, // Total: 60
    "30-34": { male: 26, female: 24 }  // Total: 50
  },
  2030: {
    "20-24": { male: 30, female: 28 }, // Total: 58
    "25-29": { male: 29, female: 25 }, // Total: 54
    "30-34": { male: 24, female: 28 }  // Total: 52
  },
  2035: {
    "20-24": { male: 27, female: 28 }, // Total: 55
    "25-29": { male: 25, female: 27 }, // Total: 52
    "30-34": { male: 27, female: 30 }  // Total: 57
  },
  2040: {
    "20-24": { male: 20, female: 28 }, // Total: 48
    "25-29": { male: 29, female: 30 }, // Total: 59
    "30-34": { male: 24, female: 30 }  // Total: 54
  },
  2045: {
    "20-24": { male: 24, female: 26 }, // Total: 50
    "25-29": { male: 20, female: 22 }, // Total: 42
    "30-34": { male: 24, female: 28 }  // Total: 52
  },
  2050: {
    "20-24": { male: 23, female: 24 }, // Total: 47
    "25-29": { male: 21, female: 20 }, // Total: 41
    "30-34": { male: 25, female: 26 }  // Total: 51
  }
};

const coopMemberData = {
  2030: {
    "20-24": 1,
    "25-29": 1.1,
    "30-34": 6.6
  },
  2035: {
    "20-24": 1,
    "25-29": 1,
    "30-34": 7.3
  },
  2040: {
    "20-24": 0.8,
    "25-29": 1.2,
    "30-34": 6.9
  },
  2045: {
    "20-24": 0.9,
    "25-29": 0.8,
    "30-34": 6.6
  },
  2050: {
    "20-24": 0.8,
    "25-29": 0.8,
    "30-34": 6.5
  }
};

// Calculate total population for each age group and year
const totalPopulation = {};
for (const year in populationData) {
  totalPopulation[year] = {};
  for (const ageGroup in populationData[year]) {
    const data = populationData[year][ageGroup];
    totalPopulation[year][ageGroup] = data.male + data.female;
  }
}

console.log('Aomori Prefecture (青森県) - Coop Member Share Rate Analysis');
console.log('==============================================================');
console.log('');

// Calculate and display share rates
const shareRates = {};
const targetAgeGroups = ['20-24', '25-29', '30-34'];

// Calculate 2025 base rates (since coop member projections start from 2030, we need to infer base rates)
console.log('Population data for 2025 (for reference):');
targetAgeGroups.forEach(ageGroup => {
  const population = totalPopulation['2025'][ageGroup];
  console.log(`  ${ageGroup}: ${population} people`);
});
console.log('');

// Note: We don't have coop member data for 2025, so we'll use 2030 as baseline for comparison
console.log('Share Rate Analysis (Coop Members / Total Population):');
console.log('Year      20-24 Age Group    25-29 Age Group    30-34 Age Group');
console.log('        Members Pop  Rate   Members Pop  Rate   Members Pop   Rate');
console.log('---------------------------------------------------------------------');

const years = ['2030', '2035', '2040', '2045', '2050'];
const baselineRates = {}; // We'll use 2030 as baseline since it's the first year with coop data

years.forEach((year, index) => {
  const yearData = [];
  
  targetAgeGroups.forEach(ageGroup => {
    const members = coopMemberData[year][ageGroup];
    const population = totalPopulation[year][ageGroup];
    const rate = (members / population * 100).toFixed(3);
    
    if (!shareRates[ageGroup]) shareRates[ageGroup] = {};
    shareRates[ageGroup][year] = parseFloat(rate);
    
    // Store 2030 as baseline
    if (year === '2030') {
      baselineRates[ageGroup] = parseFloat(rate);
    }
    
    yearData.push({ members, population, rate });
  });
  
  const line = `${year}    ${yearData[0].members.toString().padStart(4)} ${yearData[0].population.toString().padStart(4)} ${yearData[0].rate.padStart(5)}%  ${yearData[1].members.toString().padStart(4)} ${yearData[1].population.toString().padStart(4)} ${yearData[1].rate.padStart(5)}%  ${yearData[2].members.toString().padStart(4)} ${yearData[2].population.toString().padStart(4)} ${yearData[2].rate.padStart(6)}%`;
  console.log(line);
});

console.log('');
console.log('Share Rate Consistency Analysis:');
console.log('===============================');

// Check for significant variations (>1%)
let hasSignificantVariations = false;

targetAgeGroups.forEach(ageGroup => {
  console.log(`\n${ageGroup} Age Group:`);
  console.log(`  Baseline rate (2030): ${baselineRates[ageGroup].toFixed(3)}%`);
  
  let maxRate = baselineRates[ageGroup];
  let minRate = baselineRates[ageGroup];
  const deviations = [];
  
  years.slice(1).forEach(year => { // Skip 2030 since it's baseline
    const currentRate = shareRates[ageGroup][year];
    const deviation = Math.abs(currentRate - baselineRates[ageGroup]);
    
    maxRate = Math.max(maxRate, currentRate);
    minRate = Math.min(minRate, currentRate);
    
    deviations.push({
      year,
      rate: currentRate,
      deviation,
      isSignificant: deviation > 1.0
    });
    
    console.log(`  ${year}: ${currentRate.toFixed(3)}% (deviation: ${deviation > 0 ? '+' : ''}${(currentRate - baselineRates[ageGroup]).toFixed(3)}%)`);
    
    if (deviation > 1.0) {
      hasSignificantVariations = true;
    }
  });
  
  const range = maxRate - minRate;
  console.log(`  Range: ${minRate.toFixed(3)}% - ${maxRate.toFixed(3)}% (${range.toFixed(3)}% variation)`);
  
  // Check if any significant deviations exist
  const significantDeviations = deviations.filter(d => d.isSignificant);
  if (significantDeviations.length > 0) {
    console.log(`  ⚠️  SIGNIFICANT VARIATIONS (>1%) found in years: ${significantDeviations.map(d => d.year).join(', ')}`);
  } else {
    console.log(`  ✅ Share rates remain consistent (all variations <1%)`);
  }
});

console.log('\n');
console.log('SUMMARY:');
console.log('========');

if (hasSignificantVariations) {
  console.log('❌ VERIFICATION FAILED: Significant variations (>1%) detected in share rates.');
  console.log('   The coop member projection data does NOT maintain consistent share rates');
  console.log('   for young age groups in Aomori Prefecture across the projection period.');
} else {
  console.log('✅ VERIFICATION PASSED: All share rate variations are within acceptable limits (<1%).');
  console.log('   The coop member projection data successfully maintains consistent share rates');
  console.log('   for young age groups in Aomori Prefecture across the projection period.');
}

console.log('\nNote: This analysis compares share rates across projection years 2030-2050,');
console.log('using 2030 as the baseline since coop member data starts from that year.');