// データの整合性を分析するスクリプト
const fs = require('fs');
const path = require('path');

class DataConsistencyAnalyzer {
  constructor() {
    this.dataDir = path.join(__dirname, 'public/data');
    this.populationDir = path.join(this.dataDir, 'population');
    this.coopMemberDir = path.join(this.dataDir, 'coop-members');
  }

  analyzeAll() {
    console.log('🔍 データ整合性分析を開始...\n');
    
    // 1. 北海道の人口データ詳細分析
    this.analyzeHokkaidoPopulation();
    
    // 2. 組合員データとの比較
    this.compareCoopMemberData();
    
    // 3. 全国データとの整合性確認
    this.checkNationalConsistency();
  }

  analyzeHokkaidoPopulation() {
    console.log('📊 北海道人口データの詳細分析\n');
    
    try {
      // 2025年と2030年のデータを読み込み
      const data2025 = JSON.parse(fs.readFileSync(
        path.join(this.populationDir, 'population_2025.json'), 'utf8'
      ));
      const data2030 = JSON.parse(fs.readFileSync(
        path.join(this.populationDir, 'population_2030.json'), 'utf8'
      ));
      
      // 北海道データを抽出
      const hokkaido2025 = data2025['01'] || [];
      const hokkaido2030 = data2030['01'] || [];
      
      console.log('🗓️ 2025年 北海道データ:');
      console.log(`  データ件数: ${hokkaido2025.length}件`);
      
      // 年齢階級別データをまとめる
      const ages2025 = this.groupByAge(hokkaido2025);
      const ages2030 = this.groupByAge(hokkaido2030);
      
      console.log('\n📈 年齢階級別人口データ比較:');
      console.log('年齢階級'.padEnd(10) + '2025年(千人)'.padEnd(15) + '2030年(千人)'.padEnd(15) + '変化'.padEnd(10) + '変化率');
      console.log('-'.repeat(70));
      
      const allAges = [...new Set([...Object.keys(ages2025), ...Object.keys(ages2030)])].sort();
      
      allAges.forEach(age => {
        const pop2025 = ages2025[age] || 0;
        const pop2030 = ages2030[age] || 0;
        const change = pop2030 - pop2025;
        const changeRate = pop2025 > 0 ? ((change / pop2025) * 100) : 0;
        
        console.log(
          age.padEnd(10) + 
          pop2025.toString().padEnd(15) + 
          pop2030.toString().padEnd(15) + 
          change.toString().padEnd(10) + 
          `${changeRate.toFixed(1)}%`
        );
      });
      
      // 40-44歳の詳細分析
      console.log('\n🔍 40-44歳の詳細分析:');
      const age40_44_2025 = hokkaido2025.filter(d => d.ageGroup === '40-44');
      const age40_44_2030 = hokkaido2030.filter(d => d.ageGroup === '40-44');
      
      console.log('2025年:');
      age40_44_2025.forEach(d => {
        console.log(`  ${d.gender}: ${d.population}千人 (実人数: ${(d.population * 1000).toLocaleString()}人)`);
      });
      
      console.log('2030年:');
      age40_44_2030.forEach(d => {
        console.log(`  ${d.gender}: ${d.population}千人 (実人数: ${(d.population * 1000).toLocaleString()}人)`);
      });
      
    } catch (error) {
      console.error('❌ 北海道人口データ分析エラー:', error.message);
    }
  }

  compareCoopMemberData() {
    console.log('\n\n🤝 組合員データとの比較分析\n');
    
    try {
      // 北海道の組合員データを読み込み
      const coopData2025 = JSON.parse(fs.readFileSync(
        path.join(this.coopMemberDir, 'coop_members_01_2025.json'), 'utf8'
      ));
      const coopData2030 = JSON.parse(fs.readFileSync(
        path.join(this.coopMemberDir, 'coop_members_01_2030.json'), 'utf8'
      ));
      
      console.log('🗓️ 北海道組合員データ:');
      console.log(`2025年データ件数: ${coopData2025.length}件`);
      console.log(`2030年データ件数: ${coopData2030.length}件`);
      
      // 40-44歳の組合員データ
      const coop40_44_2025 = coopData2025.find(d => d.ageGroup === '40-44');
      const coop40_44_2030 = coopData2030.find(d => d.ageGroup === '40-44');
      
      console.log('\n📊 40-44歳組合員数:');
      console.log(`2025年: ${coop40_44_2025?.memberCount || 0}千人`);
      console.log(`2030年: ${coop40_44_2030?.memberCount || 0}千人`);
      
      // シェア率の計算
      const popData2025 = JSON.parse(fs.readFileSync(
        path.join(this.populationDir, 'population_2025.json'), 'utf8'
      ));
      const hokkaido2025 = popData2025['01'] || [];
      const totalPop40_44_2025 = hokkaido2025
        .filter(d => d.ageGroup === '40-44')
        .reduce((sum, d) => sum + d.population, 0);
      
      const shareRate = totalPop40_44_2025 > 0 ? 
        ((coop40_44_2025?.memberCount || 0) / totalPop40_44_2025) * 100 : 0;
      
      console.log(`\n📈 2025年シェア率計算:`);
      console.log(`  人口: ${totalPop40_44_2025}千人`);
      console.log(`  組合員: ${coop40_44_2025?.memberCount || 0}千人`);
      console.log(`  シェア率: ${shareRate.toFixed(2)}%`);
      
      // 他の年齢階級のシェア率も確認
      console.log('\n📋 他の年齢階級のシェア率:');
      const ageGroups = ['20-24', '25-29', '30-34', '35-39', '45-49', '50-54'];
      
      ageGroups.forEach(age => {
        const popAge = hokkaido2025
          .filter(d => d.ageGroup === age)
          .reduce((sum, d) => sum + d.population, 0);
        const coopAge = coopData2025.find(d => d.ageGroup === age);
        const shareRate = popAge > 0 ? 
          ((coopAge?.memberCount || 0) / popAge) * 100 : 0;
        
        console.log(`  ${age}: ${shareRate.toFixed(1)}% (人口${popAge}千人, 組合員${coopAge?.memberCount || 0}千人)`);
      });
      
    } catch (error) {
      console.error('❌ 組合員データ比較エラー:', error.message);
    }
  }

  checkNationalConsistency() {
    console.log('\n\n🌏 全国データとの整合性確認\n');
    
    try {
      // 全国データの確認
      const nationalData2025 = JSON.parse(fs.readFileSync(
        path.join(this.populationDir, 'population_national_2025.json'), 'utf8'
      ));
      
      console.log('📊 全国データ構造:');
      console.log(`データ件数: ${nationalData2025.length}件`);
      
      // 40-44歳の全国データ
      const national40_44 = nationalData2025.filter(d => d.ageGroup === '40-44');
      console.log(`\n🎌 全国40-44歳人口 (2025年):`);
      national40_44.forEach(d => {
        console.log(`  ${d.gender}: ${d.population.toLocaleString()}千人`);
      });
      
      const totalNational40_44 = national40_44.reduce((sum, d) => sum + d.population, 0);
      console.log(`  合計: ${totalNational40_44.toLocaleString()}千人`);
      
      // 北海道が全国に占める割合
      const hokkaido40_44 = 232; // 前回の分析結果
      const nationalRatio = (hokkaido40_44 / totalNational40_44) * 100;
      console.log(`\n📊 北海道が全国に占める割合:`);
      console.log(`  ${nationalRatio.toFixed(2)}% (北海道${hokkaido40_44}千人 / 全国${totalNational40_44.toLocaleString()}千人)`);
      
    } catch (error) {
      console.error('❌ 全国データ整合性確認エラー:', error.message);
    }
  }

  groupByAge(data) {
    const grouped = {};
    data.forEach(d => {
      if (!grouped[d.ageGroup]) {
        grouped[d.ageGroup] = 0;
      }
      grouped[d.ageGroup] += d.population;
    });
    return grouped;
  }
}

// 実行
const analyzer = new DataConsistencyAnalyzer();
analyzer.analyzeAll();