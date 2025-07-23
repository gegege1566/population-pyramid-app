const fs = require('fs');
const path = require('path');

// 組合員データの整合性テストスクリプト

class CoopMemberDataTester {
  constructor() {
    this.dataDir = path.join(__dirname, '../public/data/coop-members');
  }

  // すべてのデータファイルをテスト
  testAllData() {
    console.log('組合員データの整合性テストを開始...\n');

    const files = fs.readdirSync(this.dataDir);
    let totalTests = 0;
    let passedTests = 0;

    files.forEach(filename => {
      if (filename.endsWith('.json')) {
        totalTests++;
        const result = this.testFile(filename);
        if (result.passed) {
          passedTests++;
          console.log(`✓ ${filename}: PASS`);
        } else {
          console.log(`✗ ${filename}: FAIL - ${result.error}`);
        }
      }
    });

    console.log(`\nテスト結果: ${passedTests}/${totalTests} 通過`);
    return passedTests === totalTests;
  }

  // 個別ファイルをテスト
  testFile(filename) {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // 基本構造チェック
      if (!Array.isArray(data)) {
        return { passed: false, error: 'データが配列ではありません' };
      }

      if (data.length === 0) {
        return { passed: false, error: 'データが空です' };
      }

      // サンプルレコードをチェック
      const sample = data[0];
      const requiredFields = ['year', 'prefecture', 'prefectureCode', 'ageGroup', 'memberCount'];
      
      for (const field of requiredFields) {
        if (!(field in sample)) {
          return { passed: false, error: `必須フィールドが不足: ${field}` };
        }
      }

      // 年度チェック
      const expectedYear = parseInt(filename.match(/(\d{4})/)[1]);
      if (sample.year !== expectedYear) {
        return { passed: false, error: `年度が一致しません: ${sample.year} vs ${expectedYear}` };
      }

      // 年齢階層チェック
      const expectedAgeGroups = [
        '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
        '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
        '75-79', '80-84', '85-89', '90-94', '95-99'
      ];

      const actualAgeGroups = [...new Set(data.map(item => item.ageGroup))];
      if (actualAgeGroups.length !== expectedAgeGroups.length) {
        return { passed: false, error: `年齢階層数が一致しません: ${actualAgeGroups.length} vs ${expectedAgeGroups.length}` };
      }

      // データ値チェック
      const invalidData = data.find(item => 
        typeof item.memberCount !== 'number' || 
        item.memberCount < 0 || 
        isNaN(item.memberCount)
      );
      
      if (invalidData) {
        return { passed: false, error: `無効なmemberCountデータ: ${invalidData.memberCount}` };
      }

      // 組合員数の合理性チェック（20歳未満は0であるべき）
      const underAge20 = data.filter(item => 
        ['0-4', '5-9', '10-14', '15-19'].includes(item.ageGroup) && 
        item.memberCount !== 0
      );
      
      if (underAge20.length > 0) {
        return { passed: false, error: '20歳未満の組合員数が0ではありません' };
      }

      return { passed: true };

    } catch (error) {
      return { passed: false, error: `JSONパースエラー: ${error.message}` };
    }
  }

  // 統計情報を表示
  showStatistics() {
    console.log('\n組合員データ統計情報:\n');

    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    
    files.forEach(filename => {
      const filepath = path.join(this.dataDir, filename);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      const totalMembers = data.reduce((sum, item) => sum + item.memberCount, 0);
      const prefecture = data[0].prefecture;
      const year = data[0].year;
      
      console.log(`${prefecture} (${year}年): ${totalMembers.toFixed(1)}千人`);
    });
  }
}

// スクリプト実行
if (require.main === module) {
  const tester = new CoopMemberDataTester();
  const success = tester.testAllData();
  
  if (success) {
    tester.showStatistics();
    console.log('\n✓ すべてのテストが通過しました');
  } else {
    console.log('\n✗ 一部のテストが失敗しました');
    process.exit(1);
  }
}

module.exports = CoopMemberDataTester;