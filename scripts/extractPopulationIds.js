const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function extractPopulationIds() {
  try {
    console.log('Extracting population data IDs...\n');
    
    const workbook = XLSX.readFile(path.join(__dirname, '..', '提供データ一覧_20250722063659.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    // ヘッダー行を特定（Row 3がヘッダー）
    const headerRow = data[2]; // 0ベースなので2
    console.log('Headers:', headerRow);
    
    // データ行を処理
    const populationData = [];
    
    for (let i = 4; i < data.length; i++) { // Row 5以降がデータ
      const row = data[i];
      if (row && row.length > 0) {
        const record = {
          no: row[0],
          graphTitle: row[1],
          seriesName: row[2],
          timeTable: row[3],
          region: row[4],
          monthly: row[5],
          monthlySeasonallyAdjusted: row[6],
          quarterly: row[7],
          quarterlySeasonallyAdjusted: row[8],
          yearly: row[9],
          fiscalYear: row[10],
          source: row[11],
          startDate: row[12],
          endDate: row[13],
          seriesId: row[14],
          seriesElementId: row[15]
        };
        
        // 人口関連データを抽出
        if (record.graphTitle && 
            (record.graphTitle.includes('人口') || record.graphTitle.includes('ピラミッド'))) {
          populationData.push(record);
          console.log(`Found: ${record.graphTitle}`);
          console.log(`  Series ID: ${record.seriesId}`);
          console.log(`  Element ID: ${record.seriesElementId}`);
          console.log(`  Source: ${record.source}`);
          console.log(`  Period: ${record.startDate} - ${record.endDate}`);
          console.log();
        }
      }
    }
    
    // 結果を保存
    if (populationData.length > 0) {
      const outputPath = path.join(__dirname, 'population_series_ids.json');
      fs.writeFileSync(outputPath, JSON.stringify(populationData, null, 2));
      
      console.log(`✅ Found ${populationData.length} population datasets`);
      console.log(`📁 Saved to: ${outputPath}`);
      
      // APIで使用するID一覧を生成
      const apiIds = {
        populationPyramid: {
          seriesId: populationData[0]?.seriesId,
          seriesElementId: populationData[0]?.seriesElementId,
          description: populationData[0]?.graphTitle,
          source: populationData[0]?.source,
          timeRange: `${populationData[0]?.startDate} - ${populationData[0]?.endDate}`
        }
      };
      
      const apiIdsPath = path.join(__dirname, 'api_ids.json');
      fs.writeFileSync(apiIdsPath, JSON.stringify(apiIds, null, 2));
      console.log(`📋 API IDs saved to: ${apiIdsPath}`);
      
      return apiIds;
    } else {
      console.log('❌ No population datasets found');
      return null;
    }
    
  } catch (error) {
    console.error('Error extracting IDs:', error.message);
    return null;
  }
}

extractPopulationIds();