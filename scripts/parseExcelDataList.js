const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseExcelDataList() {
  try {
    console.log('Reading Excel file...\n');
    
    // Excelファイルを読み込み
    const workbook = XLSX.readFile(path.join(__dirname, '..', '提供データ一覧_20250722063659.xlsx'));
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets:`);
    sheetNames.forEach(name => console.log(`  - ${name}`));
    console.log();
    
    // 各シートを確認
    const relevantData = [];
    
    sheetNames.forEach(sheetName => {
      console.log(`\n=== Sheet: ${sheetName} ===`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length > 0) {
        console.log(`Rows: ${data.length}`);
        console.log('Headers:', data[0]);
        
        // 人口関連のデータを検索
        const populationRows = data.filter((row, index) => {
          if (index === 0) return false; // ヘッダーをスキップ
          const rowStr = row.join(' ').toLowerCase();
          return (rowStr.includes('人口') || rowStr.includes('population')) &&
                 (rowStr.includes('都道府県') || rowStr.includes('prefecture')) &&
                 (rowStr.includes('年齢') || rowStr.includes('age') || rowStr.includes('歳階級'));
        });
        
        console.log(`Found ${populationRows.length} population-related rows`);
        
        if (populationRows.length > 0) {
          console.log('\nRelevant data:');
          populationRows.slice(0, 5).forEach((row, index) => {
            console.log(`${index + 1}. ID: ${row[0] || 'N/A'} - ${row[1] || 'N/A'}`);
            relevantData.push({
              sheet: sheetName,
              id: row[0],
              title: row[1],
              description: row[2],
              lastUpdate: row[3],
              fullRow: row
            });
          });
        }
      }
    });
    
    // 結果をファイルに保存
    if (relevantData.length > 0) {
      const outputPath = path.join(__dirname, 'relevant_population_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(relevantData, null, 2));
      console.log(`\n✅ Found ${relevantData.length} relevant datasets`);
      console.log(`📁 Saved to: ${outputPath}`);
      
      // 年代別に整理
      console.log('\n📊 Summary by potential year ranges:');
      const yearPatterns = {
        '2020-2024': relevantData.filter(d => d.title?.match(/202[0-4]/)),
        '2015-2019': relevantData.filter(d => d.title?.match(/201[5-9]/)),
        '2010-2014': relevantData.filter(d => d.title?.match(/201[0-4]/)),
        '国勢調査': relevantData.filter(d => d.title?.includes('国勢調査')),
        '人口推計': relevantData.filter(d => d.title?.includes('人口推計')),
        '将来推計': relevantData.filter(d => d.title?.includes('将来推計'))
      };
      
      Object.entries(yearPatterns).forEach(([category, items]) => {
        if (items.length > 0) {
          console.log(`\n${category}: ${items.length} datasets`);
          items.slice(0, 3).forEach(item => {
            console.log(`  - ID: ${item.id} | ${item.title?.substring(0, 60)}...`);
          });
        }
      });
    } else {
      console.log('❌ No relevant population datasets found');
    }
    
  } catch (error) {
    console.error('Error parsing Excel file:', error.message);
  }
}

parseExcelDataList();