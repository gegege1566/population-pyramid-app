const fs = require('fs');
const path = require('path');

// Excelファイルを16進数で読み込んで文字列を検索
function searchInBinaryFile(filePath, searchTerms) {
  console.log('=== Searching Excel file for future projection data ===\n');
  
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000000)); // 最初の1MBのみ検索
    
    console.log(`File size: ${buffer.length} bytes`);
    console.log(`Searching in first ${Math.min(buffer.length, 1000000)} bytes\n`);
    
    const foundResults = {};
    
    for (const term of searchTerms) {
      const matches = [];
      let index = 0;
      
      while ((index = content.indexOf(term, index)) !== -1) {
        // 前後100文字のコンテキストを取得
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + term.length + 50);
        const context = content.substring(start, end)
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // 制御文字を除去
          .trim();
        
        if (context.length > term.length) {
          matches.push({
            position: index,
            context: context
          });
        }
        
        index += term.length;
        
        // 最大10個まで
        if (matches.length >= 10) break;
      }
      
      if (matches.length > 0) {
        foundResults[term] = matches;
      }
    }
    
    // 結果を表示
    for (const [term, matches] of Object.entries(foundResults)) {
      console.log(`Found "${term}" (${matches.length} occurrences):`);
      matches.forEach((match, i) => {
        console.log(`  ${i + 1}. Position ${match.position}: "${match.context}"`);
      });
      console.log();
    }
    
    // 数字の系列IDパターンを検索
    console.log('=== Searching for series ID patterns ===');
    const seriesIdPattern = /[0-9]{19}/g;
    const seriesIds = [];
    let match;
    
    while ((match = seriesIdPattern.exec(content)) !== null && seriesIds.length < 20) {
      if (!seriesIds.includes(match[0])) {
        seriesIds.push(match[0]);
      }
    }
    
    console.log('Found series IDs:');
    seriesIds.forEach(id => console.log(`  ${id}`));
    
    return { foundResults, seriesIds };
    
  } catch (error) {
    console.error('Error reading file:', error.message);
    return null;
  }
}

// 検索対象のキーワード
const searchTerms = [
  '将来推計',
  '将来',
  '推計',
  '予測', 
  'projection',
  '2025',
  '2030',
  '2040',
  '2050',
  '0201010000000010000', // 既知の人口ピラミッドID
];

const excelPath = path.join(__dirname, '..', '提供データ一覧_20250722063659.xlsx');
const results = searchInBinaryFile(excelPath, searchTerms);

if (results) {
  // 結果をJSONファイルに保存
  const outputPath = path.join(__dirname, 'excel_search_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}