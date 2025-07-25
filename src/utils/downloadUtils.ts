import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Excelシート名の安全化（31文字制限対応）
const createSafeSheetName = (name: string): string => {
  if (name.length <= 31) return name;
  
  // 複数地域の場合は短縮表示
  if (name.includes('・')) {
    const parts = name.split('・');
    if (parts.length > 2) {
      // 年度表示があるかチェック
      if (name.includes('年')) {
        return `${parts[0]}他${parts.length - 1}地域_${name.includes('比較') ? '比較' : name.match(/\d+年/)?.[0] || ''}`.substring(0, 31);
      } else {
        return `${parts[0]}他${parts.length - 1}地域_比較`.substring(0, 31);
      }
    }
  }
  
  return name.substring(0, 31);
};

// テーブルデータの型定義
export interface TableRowData {
  ageGroup: string;
  malePopulation: number;
  femalePopulation: number;
  total: number;
  coopMembers?: number;
}

export interface ComparisonTableRowData {
  ageGroup: string;
  male1: number;
  female1: number;
  total1: number;
  male2: number;
  female2: number;
  total2: number;
  changeRate: number;
  changeAmount: number;
}

// Excelダウンロード機能（単一年度データ）
export const downloadAsExcel = (
  data: TableRowData[],
  prefecture: string,
  year: number,
  showCoopMembers: boolean = false,
  abbreviatedName?: string
) => {
  // ワークシート用のデータを準備
  const worksheetData: (string | number)[][] = [
    // 1行目: 都道府県名
    [`${prefecture} (${year}年)`],
    // 2行目: 単位表示
    ['単位：千人'],
    // 3行目: 空行
    [],
    // 4行目: ヘッダー行
    showCoopMembers 
      ? ['年齢層', '男性人口', '女性人口', '合計人口', '組合員数']
      : ['年齢層', '男性人口', '女性人口', '合計人口']
  ];

  // データ行を追加
  data.forEach(row => {
    const rowData: (string | number)[] = [
      `${row.ageGroup}歳`,
      row.malePopulation,
      row.femalePopulation,
      row.total
    ];
    
    if (showCoopMembers) {
      rowData.push(row.coopMembers || 0);
    }
    
    worksheetData.push(rowData);
  });

  // 合計行を追加
  const totalRow: (string | number)[] = [
    '合計',
    data.reduce((sum, row) => sum + row.malePopulation, 0),
    data.reduce((sum, row) => sum + row.femalePopulation, 0),
    data.reduce((sum, row) => sum + row.total, 0)
  ];
  
  if (showCoopMembers) {
    totalRow.push(data.reduce((sum, row) => sum + (row.coopMembers || 0), 0));
  }
  
  worksheetData.push(totalRow);

  // ワークブックとワークシートを作成
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  
  // セルのスタイル設定
  if (worksheet['A1']) {
    worksheet['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    };
  }
  if (worksheet['A2']) {
    worksheet['A2'].s = {
      font: { italic: true, sz: 10 },
      alignment: { horizontal: 'left' }
    };
  }
  
  // ヘッダー行（4行目）のスタイル設定
  const headerRow = 4;
  const headerCols = showCoopMembers ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  headerCols.forEach(col => {
    const cellRef = `${col}${headerRow}`;
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center' }
      };
    }
  });
  
  // 列幅を自動調整
  const colWidths = [
    { wch: 12 }, // 年齢層
    { wch: 12 }, // 男性人口
    { wch: 12 }, // 女性人口
    { wch: 12 }, // 合計人口
  ];
  if (showCoopMembers) {
    colWidths.push({ wch: 12 }); // 組合員数
  }
  worksheet['!cols'] = colWidths;
  
  // ワークシートに名前を付けて追加（31文字制限対応）
  const sheetBaseName = abbreviatedName || prefecture;
  const safeSheetName = createSafeSheetName(`${sheetBaseName}_${year}年`);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  
  // ファイルをダウンロード（ファイル名に使えない文字を除去）
  const safePrefectureName = prefecture.replace(/[<>:"/\\|?*]/g, '').replace(/・/g, '_');
  const fileName = `人口データ_${safePrefectureName}_${year}年.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// 組合員詳細データの型定義
interface CoopDetailRowData {
  ageGroup: string;
  count1: number; // 実人数
  count2: number; // 実人数
  change: number; // 実人数の増減
  changeRate: number;
  ratio1: number; // 構成比
  ratio2: number; // 構成比
  annualSpending: number;
  totalSpending1: number; // 百万円単位
  totalSpending2: number; // 百万円単位
  spendingChange: number; // 百万円単位
}

// Excelダウンロード機能（年度比較データ）
export const downloadComparisonAsExcel = (
  data: ComparisonTableRowData[],
  prefecture: string,
  year1: number,
  year2: number,
  showCoopMembers: boolean = false,
  abbreviatedName?: string,
  coopDetailData?: CoopDetailRowData[] | null,
  ageGroupSpending?: any[]
) => {
  // ワークシート用のデータを準備
  const headers = [
    '年齢層',
    `${year1}年 男性`,
    `${year1}年 女性`,
    `${year1}年 合計`,
    `${year2}年 男性`,
    `${year2}年 女性`,
    `${year2}年 合計`,
    '変化率(%)',
    '増減数'
  ];

  const worksheetData: (string | number)[][] = [
    // 1行目: 都道府県名と比較年度
    [`${prefecture} (${year1}年 vs ${year2}年 比較)`],
    // 2行目: 単位表示
    ['単位：千人'],
    // 3行目: 空行
    [],
    // 4行目: ヘッダー行
    headers
  ];

  // データ行を追加
  data.forEach(row => {
    const rowData: (string | number)[] = [
      `${row.ageGroup}歳`,
      row.male1,
      row.female1,
      row.total1,
      row.male2,
      row.female2,
      row.total2,
      parseFloat(row.changeRate.toFixed(1)),
      row.changeAmount
    ];
    
    worksheetData.push(rowData);
  });

  // 合計行を追加
  const totalMale1 = data.reduce((sum, row) => sum + row.male1, 0);
  const totalFemale1 = data.reduce((sum, row) => sum + row.female1, 0);
  const grandTotal1 = totalMale1 + totalFemale1;
  const totalMale2 = data.reduce((sum, row) => sum + row.male2, 0);
  const totalFemale2 = data.reduce((sum, row) => sum + row.female2, 0);
  const grandTotal2 = totalMale2 + totalFemale2;
  const totalChangeRate = grandTotal1 > 0 ? ((grandTotal2 - grandTotal1) / grandTotal1 * 100) : 0;
  const totalChangeAmount = grandTotal2 - grandTotal1;

  const totalRow: (string | number)[] = [
    '合計',
    totalMale1,
    totalFemale1,
    grandTotal1,
    totalMale2,
    totalFemale2,
    grandTotal2,
    parseFloat(totalChangeRate.toFixed(1)),
    totalChangeAmount
  ];

  worksheetData.push(totalRow);

  // ワークブックとワークシートを作成
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  
  // セルのスタイル設定
  if (worksheet['A1']) {
    worksheet['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    };
  }
  if (worksheet['A2']) {
    worksheet['A2'].s = {
      font: { italic: true, sz: 10 },
      alignment: { horizontal: 'left' }
    };
  }
  
  // ヘッダー行（4行目）のスタイル設定
  const headerRow = 4;
  const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  headerCols.forEach(col => {
    const cellRef = `${col}${headerRow}`;
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center' }
      };
    }
  });
  
  // 列幅を自動調整
  const colWidths = [
    { wch: 12 }, // 年齢層
    { wch: 14 }, // year1 男性
    { wch: 14 }, // year1 女性  
    { wch: 14 }, // year1 合計
    { wch: 14 }, // year2 男性
    { wch: 14 }, // year2 女性
    { wch: 14 }, // year2 合計
    { wch: 12 }, // 変化率
    { wch: 14 }, // 増減数
  ];
  worksheet['!cols'] = colWidths;
  
  // ワークシートに名前を付けて追加（31文字制限対応）
  const sheetBaseName = abbreviatedName || prefecture;
  const safeSheetName = createSafeSheetName(`${sheetBaseName}_比較`);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  
  // 組合員詳細データがある場合は追加のシートを作成
  if (coopDetailData && coopDetailData.length > 0) {
    const coopHeaders = [
      '年齢層',
      `${year1}年 組合員数`,
      `${year2}年 組合員数`,
      '増減数',
      '変化率(%)',
      `${year1}年 構成比(%)`,
      `${year2}年 構成比(%)`,
      '年間利用額(円)',
      `${year1}年 総額(百万円)`,
      `${year2}年 総額(百万円)`,
      '利用額増減(百万円)'
    ];

    const coopWorksheetData: (string | number)[][] = [
      // 1行目: タイトル
      [`${prefecture} 組合員数年齢層別詳細比較 (${year1}年 vs ${year2}年)`],
      // 2行目: 単位表示
      ['※ 組合員数は実人数、構成比は各年度内での比率、利用額は年間設定金額に基づく推定値、利用額増減は2つの年度の総額差分'],
      // 3行目: 空行
      [],
      // 4行目: ヘッダー行
      coopHeaders
    ];

    // データ行を追加
    coopDetailData.forEach(row => {
      const rowData: (string | number)[] = [
        `${row.ageGroup}歳`,
        row.count1,
        row.count2,
        row.change,
        parseFloat(row.changeRate.toFixed(1)),
        parseFloat(row.ratio1.toFixed(1)),
        parseFloat(row.ratio2.toFixed(1)),
        row.annualSpending,
        parseFloat(row.totalSpending1.toFixed(0)),
        parseFloat(row.totalSpending2.toFixed(0)),
        parseFloat(row.spendingChange.toFixed(0))
      ];
      
      coopWorksheetData.push(rowData);
    });

    // 合計行を追加
    const total1 = coopDetailData.reduce((sum, row) => sum + row.count1, 0);
    const total2 = coopDetailData.reduce((sum, row) => sum + row.count2, 0);
    const totalChange = total2 - total1;
    const totalChangeRate = total1 > 0 ? ((totalChange / total1) * 100) : 0;
    const totalSpending1 = coopDetailData.reduce((sum, row) => sum + row.totalSpending1, 0);
    const totalSpending2 = coopDetailData.reduce((sum, row) => sum + row.totalSpending2, 0);
    const totalSpendingChange = totalSpending2 - totalSpending1;

    coopWorksheetData.push([
      '合計',
      total1,
      total2,
      totalChange,
      parseFloat(totalChangeRate.toFixed(1)),
      100.0,
      100.0,
      '-',
      parseFloat(totalSpending1.toFixed(0)),
      parseFloat(totalSpending2.toFixed(0)),
      parseFloat(totalSpendingChange.toFixed(0))
    ]);

    // 組合員詳細ワークシートを作成
    const coopWorksheet = XLSX.utils.aoa_to_sheet(coopWorksheetData);
    
    // セルのスタイル設定
    if (coopWorksheet['A1']) {
      coopWorksheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };
    }
    if (coopWorksheet['A2']) {
      coopWorksheet['A2'].s = {
        font: { italic: true, sz: 10 },
        alignment: { horizontal: 'left' }
      };
    }
    
    // ヘッダー行（4行目）のスタイル設定
    const coopHeaderRow = 4;
    const coopHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    coopHeaderCols.forEach(col => {
      const cellRef = `${col}${coopHeaderRow}`;
      if (coopWorksheet[cellRef]) {
        coopWorksheet[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'FFE4B5' } }, // オレンジ系の背景色
          alignment: { horizontal: 'center' }
        };
      }
    });
    
    // 列幅を自動調整
    const coopColWidths = [
      { wch: 12 }, // 年齢層
      { wch: 16 }, // 組合員数1
      { wch: 16 }, // 組合員数2
      { wch: 12 }, // 増減数
      { wch: 12 }, // 変化率
      { wch: 14 }, // 構成比1
      { wch: 14 }, // 構成比2
      { wch: 16 }, // 年間利用額
      { wch: 18 }, // 総額1
      { wch: 18 }, // 総額2
      { wch: 18 }, // 利用額増減
    ];
    coopWorksheet['!cols'] = coopColWidths;
    
    // 組合員詳細シートを追加
    const coopSheetName = createSafeSheetName(`${sheetBaseName}_組合員詳細`);
    XLSX.utils.book_append_sheet(workbook, coopWorksheet, coopSheetName);
  }
  
  // ファイルをダウンロード（ファイル名に使えない文字を除去）
  const safePrefectureName = prefecture.replace(/[<>:"/\\|?*]/g, '').replace(/・/g, '_');
  const fileName = `人口比較データ_${safePrefectureName}_${year1}年vs${year2}年.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// PDFダウンロード機能
export const downloadAsPDF = async (
  svgElement: SVGSVGElement,
  prefecture: string,
  year: number | string,
  title?: string
) => {
  try {
    // SVGを含む一時的なコンテナを作成
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.width = '800px'; // 固定幅を設定
    
    // タイトルを追加（長い場合の処理を改善）
    const titleText = title || `${prefecture} (${year}年) 人口ピラミッド`;
    const titleElement = document.createElement('h2');
    
    // タイトルの長さに応じて処理を分岐
    if (titleText.length > 50) {
      // 非常に長い場合：省略形を使用
      const shortTitle = titleText.length > 80 
        ? `${titleText.substring(0, 77)}...`
        : titleText;
      titleElement.textContent = shortTitle;
      titleElement.style.fontSize = '14px'; // フォントサイズを小さく
    } else if (titleText.length > 30) {
      // 長い場合：改行を許可
      titleElement.textContent = titleText;
      titleElement.style.fontSize = '16px';
      titleElement.style.lineHeight = '1.3';
      titleElement.style.whiteSpace = 'normal';
      titleElement.style.wordBreak = 'break-all';
    } else {
      // 標準の場合
      titleElement.textContent = titleText;
      titleElement.style.fontSize = '18px';
    }
    
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '20px';
    titleElement.style.color = '#333';
    titleElement.style.maxWidth = '760px'; // コンテナより少し小さく
    titleElement.style.margin = '0 auto 20px auto';
    container.appendChild(titleElement);
    
    // SVGのクローンを作成
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    svgClone.style.display = 'block';
    svgClone.style.margin = '0 auto';
    svgClone.style.maxWidth = '760px'; // コンテナ幅より少し小さく
    svgClone.style.height = 'auto';
    
    // SVGを中央配置するためのラッパーを作成
    const svgWrapper = document.createElement('div');
    svgWrapper.style.display = 'flex';
    svgWrapper.style.justifyContent = 'center';
    svgWrapper.style.alignItems = 'center';
    svgWrapper.style.width = '100%';
    svgWrapper.appendChild(svgClone);
    container.appendChild(svgWrapper);
    
    document.body.appendChild(container);

    // html2canvasでキャンバスに変換
    const canvas = await html2canvas(container, {
      backgroundColor: 'white',
      scale: 2, // 高解像度
      useCORS: true
    });

    // コンテナを削除
    document.body.removeChild(container);

    // PDFを作成
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // PDF内の画像サイズを計算
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgAspectRatio = canvas.width / canvas.height;
    
    let imgWidth = pdfWidth - 20; // マージンを考慮
    let imgHeight = imgWidth / imgAspectRatio;
    
    // 高さがページを超える場合は高さを基準に調整
    if (imgHeight > pdfHeight - 20) {
      imgHeight = pdfHeight - 20;
      imgWidth = imgHeight * imgAspectRatio;
    }

    // 画像を中央配置
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    // ファイルをダウンロード（ファイル名に使えない文字を除去）
    const safePrefectureName = prefecture.replace(/[<>:"/\\|?*]/g, '').replace(/・/g, '_');
    const fileName = `人口ピラミッド_${safePrefectureName}_${year}年.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('PDFの生成に失敗しました。');
  }
};

// 年度比較用PDFダウンロード機能
export const downloadComparisonAsPDF = async (
  svgElement: SVGSVGElement,
  prefecture: string,
  year1: number,
  year2: number
) => {
  try {
    // 年度比較の場合、SVGが非常に大きい可能性があるため、十分な幅を確保
    const titleText = `${prefecture} 年度比較 (${year1}年 vs ${year2}年)`;
    
    // 元のSVGのサイズを取得
    const originalWidth = parseInt(svgElement.getAttribute('width') || '1200');
    const originalHeight = parseInt(svgElement.getAttribute('height') || '600');
    
    // コンテナ幅を元のSVGサイズに合わせて設定（最小1200px、最大1600px）
    const containerWidth = Math.max(1200, Math.min(originalWidth + 100, 1600));
    
    // SVGを含む一時的なコンテナを作成
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.width = `${containerWidth}px`;
    container.style.overflow = 'visible'; // 重要：コンテナからはみ出さないように
    
    // タイトルを追加
    const titleElement = document.createElement('h2');
    
    // タイトルの長さに応じて処理を分岐
    if (titleText.length > 50) {
      const shortTitle = titleText.length > 80 
        ? `${titleText.substring(0, 77)}...`
        : titleText;
      titleElement.textContent = shortTitle;
      titleElement.style.fontSize = '16px';
    } else if (titleText.length > 30) {
      titleElement.textContent = titleText;
      titleElement.style.fontSize = '18px';
      titleElement.style.lineHeight = '1.3';
      titleElement.style.whiteSpace = 'normal';
      titleElement.style.wordBreak = 'break-all';
    } else {
      titleElement.textContent = titleText;
      titleElement.style.fontSize = '20px';
    }
    
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '20px';
    titleElement.style.color = '#333';
    titleElement.style.maxWidth = `${containerWidth - 40}px`;
    titleElement.style.margin = '0 auto 20px auto';
    container.appendChild(titleElement);
    
    // SVGのクローンを作成
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // SVGのサイズをコンテナに収まるように調整
    const maxSvgWidth = containerWidth - 40; // パディングを考慮
    const svgAspectRatio = originalWidth / originalHeight;
    
    let finalSvgWidth = Math.min(originalWidth, maxSvgWidth);
    let finalSvgHeight = finalSvgWidth / svgAspectRatio;
    
    // SVGサイズを明示的に設定
    svgClone.setAttribute('width', finalSvgWidth.toString());
    svgClone.setAttribute('height', finalSvgHeight.toString());
    svgClone.style.width = `${finalSvgWidth}px`;
    svgClone.style.height = `${finalSvgHeight}px`;
    svgClone.style.display = 'block';
    svgClone.style.margin = '0 auto';
    
    // ViewBoxを設定（元のSVGサイズを維持してスケール）
    svgClone.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // SVGを中央配置するためのラッパーを作成
    const svgWrapper = document.createElement('div');
    svgWrapper.style.display = 'flex';
    svgWrapper.style.justifyContent = 'center';
    svgWrapper.style.alignItems = 'center';
    svgWrapper.style.width = '100%';
    svgWrapper.style.overflow = 'visible';
    svgWrapper.appendChild(svgClone);
    container.appendChild(svgWrapper);
    
    document.body.appendChild(container);

    // html2canvasでキャンバスに変換（コンテナサイズに合わせて調整）
    const canvas = await html2canvas(container, {
      backgroundColor: 'white',
      scale: Math.max(1, 1800 / containerWidth), // コンテナが大きい場合はスケールを調整
      useCORS: true,
      width: containerWidth,
      height: container.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    // コンテナを削除
    document.body.removeChild(container);

    // PDFを作成
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // PDF内の画像サイズを計算
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgAspectRatio = canvas.width / canvas.height;
    
    let imgWidth = pdfWidth - 20; // マージンを考慮
    let imgHeight = imgWidth / imgAspectRatio;
    
    // 高さがページを超える場合は高さを基準に調整
    if (imgHeight > pdfHeight - 20) {
      imgHeight = pdfHeight - 20;
      imgWidth = imgHeight * imgAspectRatio;
    }

    // 画像を中央配置
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    // ファイルをダウンロード
    const safePrefectureName = prefecture.replace(/[<>:"/\\|?*]/g, '').replace(/・/g, '_');
    const fileName = `人口比較ピラミッド_${safePrefectureName}_${year1}vs${year2}年.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('PDFの生成に失敗しました。');
  }
};