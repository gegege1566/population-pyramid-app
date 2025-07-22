const XLSX = require('xlsx');
const path = require('path');

function inspectExcel() {
  try {
    console.log('Inspecting Excel file structure...\n');
    
    const workbook = XLSX.readFile(path.join(__dirname, '..', '提供データ一覧_20250722063659.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`Sheet: ${sheetName}`);
    console.log('Range:', worksheet['!ref']);
    
    // 生データを確認
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    console.log(`Total rows: ${data.length}\n`);
    
    // 最初の10行を詳細表示
    console.log('Raw data (first 10 rows):');
    data.slice(0, 10).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
    // セルの内容を直接確認
    console.log('\nDirect cell access:');
    ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].forEach(cell => {
      if (worksheet[cell]) {
        console.log(`${cell}: ${worksheet[cell].v}`);
      }
    });
    
    // JSONフォーマットでも確認
    console.log('\nJSON format (with headers):');
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('Keys:', Object.keys(jsonData[0] || {}));
    if (jsonData.length > 0) {
      console.log('First record:', jsonData[0]);
      console.log('Second record:', jsonData[1]);
    }
    
  } catch (error) {
    console.error('Error inspecting Excel file:', error.message);
  }
}

inspectExcel();