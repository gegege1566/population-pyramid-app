import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { createPopulationPyramid, PyramidData } from '../utils/populationAnalysis';
import { LocalDataService } from '../services/localDataService';
import { CoopMemberData } from '../types/coopMember';
import { downloadAsExcel, downloadAsPDF } from '../utils/downloadUtils';

interface PopulationPyramidProps {
  data: PopulationData[];
  width?: number;
  height?: number;
  prefecture?: string;
  year?: number;
  fixedScale?: number; // 2025年ベースの固定スケール
  showCoopMembers?: boolean;
  coopMemberData?: CoopMemberData[];
  abbreviatedName?: string; // シート名・タイトル用の省略形
  pdfTitleName?: string; // PDF用タイトル地域名
}

const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  data,
  width = 800,
  height = 600,
  prefecture = '',
  year = 2025,
  fixedScale,
  showCoopMembers = false,
  coopMemberData,
  abbreviatedName,
  pdfTitleName
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isInitializedRef = useRef(false);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // ツールチップハンドラーの更新
  const updateTooltipHandlers = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    pyramidData: PyramidData,
    data: PopulationData[]
  ) => {
    // 男性バーのツールチップ更新
    g.selectAll('.male-bar')
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const index = pyramidData.maleData.indexOf(d as number);
        const ageGroup = pyramidData.ageGroups[index];
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const population = isNational 
          ? Math.abs(d as number) * 1000
          : Math.abs(d as number) * 1000;
        
        tooltip.html(`男性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

    // 女性バーのツールチップ更新
    g.selectAll('.female-bar')
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const index = pyramidData.femaleData.indexOf(d as number);
        const ageGroup = pyramidData.ageGroups[index];
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const population = isNational 
          ? (d as number) * 1000
          : (d as number) * 1000;
        
        tooltip.html(`女性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });
  };

  const drawPyramid = useCallback((
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    pyramidData: PyramidData,
    width: number,
    height: number,
    prefecture: string,
    year: number,
    dynamicScale: number
  ) => {
    console.log('drawPyramid called with:', { width, height, prefecture, year, dynamicScale, ageGroups: pyramidData.ageGroups.length });
    
    // SVGの状態を確認
    console.log('SVG node exists:', !!svg.node());
    console.log('SVG element:', svg.node());
    
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    console.log('Chart dimensions:', { chartWidth, chartHeight, margin });

    // 固定スケールを使用
    const maxValue = dynamicScale;
    

    // スケール設定
    const xScale = d3.scaleLinear()
      .domain([-maxValue, maxValue])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(pyramidData.ageGroups)
      .range([0, chartHeight])
      .padding(0.1);

    // メインコンテナ
    const g = svg.append('g')
      .attr('class', 'chart-container')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    console.log('Created chart container with transform:', `translate(${margin.left},${margin.top})`);
      
    // スケール表示を削除

    // 男性バー（左側）
    const maleBars = g.selectAll('.male-bar')
      .data(pyramidData.maleData);
      
    console.log('Male bars data length:', pyramidData.maleData.length);
      
    maleBars.enter()
      .append('rect')
      .attr('class', 'male-bar')
      .attr('x', xScale(0))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#3B82F6')
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const index = pyramidData.maleData.indexOf(d);
        const ageGroup = pyramidData.ageGroups[index];
        // 全国データのみ特別処理、都道府県データはそのまま
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const graphValue = Math.abs(d);
        const population = isNational 
          ? graphValue * 1000 // 全国データ：千人単位グラフ値を実人数に変換
          : graphValue * 1000; // 都道府県データ：千人単位から人単位に変換
        
        console.log(`🔍 Tooltip data - ${ageGroup} male: graph=${graphValue}, isNational=${isNational}, final=${population}`);
        
        tooltip.html(`男性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      })
      .transition()
      .duration(500)
      .attr('x', d => xScale(d))
      .attr('width', d => xScale(0) - xScale(d));

    // 女性バー（右側）
    const femaleBars = g.selectAll('.female-bar')
      .data(pyramidData.femaleData);
      
    femaleBars.enter()
      .append('rect')
      .attr('class', 'female-bar')
      .attr('x', xScale(0))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#EC4899')
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const index = pyramidData.femaleData.indexOf(d);
        const ageGroup = pyramidData.ageGroups[index];
        // 全国データのみ特別処理、都道府県データはそのまま
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const population = isNational 
          ? d * 1000 // 全国データ：千人単位グラフ値を実人数に変換
          : d * 1000; // 都道府県データ：千人単位から人単位に変換
        
        tooltip.html(`女性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      })
      .transition()
      .duration(500)
      .attr('width', d => xScale(d) - xScale(0));

    // 中央線
    g.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#374151')
      .attr('stroke-width', 2);

    // Y軸（年齢階級）
    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // X軸（人口）
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => Math.abs(d as number).toLocaleString());
    
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // 軸ラベル
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('年齢階級');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('人口 (千人単位)');

    // 性別ラベル
    g.append('text')
      .attr('class', 'male-label')
      .attr('x', xScale(-maxValue * 0.7))
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#3B82F6')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('男性');

    g.append('text')
      .attr('class', 'female-label')
      .attr('x', xScale(maxValue * 0.7))
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#EC4899')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('女性');

    // グリッドライン
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat(() => '');
    
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxisGrid)
      .selectAll('line')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 0.5);
  }, [data]);

  const updatePyramidWithAnimation = useCallback((
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    pyramidData: PyramidData,
    width: number,
    height: number,
    prefecture: string,
    year: number,
    dynamicScale: number
  ) => {
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxValue = dynamicScale;

    // スケール設定
    const xScale = d3.scaleLinear()
      .domain([-maxValue, maxValue])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(pyramidData.ageGroups)
      .range([0, chartHeight])
      .padding(0.1);

    const g = svg.select('.chart-container') as d3.Selection<SVGGElement, unknown, null, undefined>;

    // アニメーション設定
    const transition = d3.transition()
      .duration(1200)
      .ease(d3.easeCubicInOut);

    // 男性バーの更新（データバインディングを考慮）
    const maleBars = g.selectAll('.male-bar')
      .data(pyramidData.maleData);

    maleBars
      .transition(transition)
      .attr('x', d => xScale(d))
      .attr('width', d => xScale(0) - xScale(d))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('height', yScale.bandwidth());

    // 女性バーの更新
    const femaleBars = g.selectAll('.female-bar')
      .data(pyramidData.femaleData);

    femaleBars
      .transition(transition)
      .attr('width', d => xScale(d) - xScale(0))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('height', yScale.bandwidth());

    // 中央線の更新
    g.select('line')
      .transition(transition)
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y2', chartHeight);

    // X軸の更新
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => Math.abs(d as number).toLocaleString());

    g.select('.x-axis')
      .transition(transition)
      .call(xAxis as any);

    // Y軸の更新（年齢階級が変わる場合）
    const yAxis = d3.axisLeft(yScale);
    g.select('.y-axis')
      .transition(transition)
      .call(yAxis as any);

    // グリッドラインの更新
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat(() => '');

    g.select('.grid')
      .transition(transition)
      .call(xAxisGrid as any)
      .selectAll('line')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 0.5);

    // 性別ラベルの位置更新
    g.select('.male-label')
      .transition(transition)
      .attr('x', xScale(-maxValue * 0.7));

    g.select('.female-label')
      .transition(transition)
      .attr('x', xScale(maxValue * 0.7));

    // ツールチップのイベントハンドラーを再設定
    updateTooltipHandlers(g, pyramidData, data);
  }, [data, updateTooltipHandlers]);

  const drawCoopMembers = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    coopData: CoopMemberData[],
    width: number,
    height: number,
    dynamicScale: number,
    populationData: PopulationData[]
  ) => {
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxValue = dynamicScale;

    // スケール設定
    const xScale = d3.scaleLinear()
      .domain([-maxValue, maxValue])
      .range([0, chartWidth]);

    // 既存のyScaleを再利用（人口ピラミッドと同じスケールを使用）
    const g = svg.select('.chart-container') as d3.Selection<SVGGElement, unknown, null, undefined>;
    
    if (!g.node()) {
      console.error('Chart container not found');
      return;
    }

    // 人口ピラミッドで使用されているyScaleの情報を取得
    const existingYAxis = g.select('.y-axis');
    if (!existingYAxis.node()) {
      console.error('Y-axis not found');
      return;
    }

    // 人口ピラミッドのageGroupsと同じものを使用するため、
    // 既存のy軸からドメインを取得
    const pyramidData = createPopulationPyramid(populationData);
    const yScale = d3.scaleBand()
      .domain(pyramidData.ageGroups)
      .range([0, chartHeight])
      .padding(0.1);

    // 既存の組合員バーを削除
    g.selectAll('.coop-member-bar').remove();

    // 組合員データを年齢階級別に整理
    const membersByAge: { [key: string]: number } = {};
    coopData.forEach(d => {
      membersByAge[d.ageGroup] = d.memberCount;
    });
    
    // 組合員バー（中央に配置）
    const coopBars = g.selectAll('.coop-member-bar')
      .data(pyramidData.ageGroups);

    const enterSelection = coopBars.enter()
      .append('rect')
      .attr('class', 'coop-member-bar');
    
    enterSelection.attr('x', (d) => {
        const memberCount = membersByAge[d] || 0;
        return xScale(-memberCount / 2);
      })
      .attr('y', (d) => yScale(d)!)
      .attr('width', (d) => {
        const memberCount = membersByAge[d] || 0;
        if (memberCount === 0) return 0;
        
        const calculatedWidth = xScale(memberCount / 2) - xScale(-memberCount / 2);
        const minWidth = 8; // 最小幅8ピクセル（より見やすく）
        const width = Math.max(calculatedWidth, minWidth);
        
        return width;
      })
      .attr('height', yScale.bandwidth())
      .attr('fill', '#FF6B35') // オレンジ色
      .attr('opacity', 0.8) // 半透明
      .attr('stroke', '#FF4500') // オレンジの枠線
      .attr('stroke-width', 1)
      .style('z-index', 1000) // 前面に表示
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const memberCount = membersByAge[d] || 0;
        const population = memberCount * 1000; // 千人単位から人単位に変換
        
        tooltip.html(`生協組合員 ${d}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });
  };

  // メインのグラフ描画ロジック
  useEffect(() => {
    console.log('Main graph effect triggered - data:', !!data, 'length:', data?.length, 'viewMode:', viewMode, 'isInitialized:', isInitializedRef.current);
    console.log('Effect conditions - hasData:', !!data, 'dataLength > 0:', (data?.length || 0) > 0, 'isGraph:', viewMode === 'graph');
    
    if (!data || data.length === 0 || viewMode !== 'graph') {
      console.log('Effect early return - data exists:', !!data, 'data length:', data?.length, 'viewMode:', viewMode);
      return;
    }

    const svg = d3.select(svgRef.current);
    const pyramidData = createPopulationPyramid(data);
    
    // 固定スケールまたは動的スケールを使用
    let scale: number;
    if (fixedScale) {
      scale = fixedScale;
    } else {
      const localDataService = new LocalDataService();
      scale = localDataService.calculateDynamicScale(data);
    }
    
    console.log('Drawing pyramid - initialized:', isInitializedRef.current, 'scale:', scale);
    
    // 初回描画またはviewModeがgraphに切り替わった時は新規描画
    if (!isInitializedRef.current) {
      console.log('Initial pyramid draw');
      svg.selectAll("*").remove();
      drawPyramid(svg, pyramidData, width, height, prefecture, year, scale);
      isInitializedRef.current = true;
    } else {
      // データ変更時はスムーズにアニメーション更新
      console.log('Updating pyramid with animation');
      updatePyramidWithAnimation(svg, pyramidData, width, height, prefecture, year, scale);
    }
  }, [data, width, height, prefecture, year, fixedScale, viewMode, drawPyramid, updatePyramidWithAnimation]);

  // viewModeが変更されたときに初期化フラグをリセット
  useEffect(() => {
    if (viewMode === 'graph') {
      isInitializedRef.current = false;
    }
  }, [viewMode]);

  // 組合員数データの描画/削除を別のuseEffectで管理
  useEffect(() => {
    if (!svgRef.current || viewMode !== 'graph') return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('.chart-container') as d3.Selection<SVGGElement, unknown, null, undefined>;
    
    console.log('Coop member effect - showCoopMembers:', showCoopMembers, 'coopMemberData:', coopMemberData?.length, 'g.node():', !!g.node());
    
    if (showCoopMembers && coopMemberData && g.node()) {
      const scale = fixedScale || new LocalDataService().calculateDynamicScale(data);
      console.log('Drawing coop members with scale:', scale);
      drawCoopMembers(svg as d3.Selection<SVGSVGElement, unknown, null, undefined>, coopMemberData, width, height, scale, data);
    } else {
      // 組合員数バーを削除
      console.log('Removing coop member bars');
      g.selectAll('.coop-member-bar').remove();
    }
  }, [showCoopMembers, coopMemberData, data, width, height, fixedScale, viewMode]);


  // 数字テーブル用のデータを準備
  const getTableData = () => {
    if (!data || data.length === 0) return null;
    
    const pyramidData = createPopulationPyramid(data);
    const result: {
      ageGroup: string;
      malePopulation: number;
      femalePopulation: number;
      total: number;
      coopMembers?: number;
    }[] = [];

    pyramidData.ageGroups.forEach((ageGroup, index) => {
      // pyramidDataから年齢別の人口データを取得
      const malePopulation = Math.abs(pyramidData.maleData[index]); // 負値を正値に変換
      const femalePopulation = pyramidData.femaleData[index];
      const total = malePopulation + femalePopulation;
      
      // 組合員データがあれば追加
      let coopMembers: number | undefined;
      if (showCoopMembers && coopMemberData) {
        const coopData = coopMemberData.find(c => c.ageGroup === ageGroup);
        coopMembers = coopData ? coopData.memberCount : 0;
      }

      result.push({
        ageGroup,
        malePopulation,
        femalePopulation,
        total,
        coopMembers
      });
    });

    return result;
  };

  const tableData = getTableData();

  // ダウンロード機能
  const handleExcelDownload = () => {
    if (tableData) {
      downloadAsExcel(tableData, prefecture, year, showCoopMembers, abbreviatedName);
    }
  };

  const handlePDFDownload = () => {
    if (svgRef.current) {
      const titleForPDF = pdfTitleName || prefecture;
      downloadAsPDF(svgRef.current, titleForPDF, year);
    }
  };

  return (
    <div className="w-full">
      {/* モード切り替えとダウンロードボタン */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        {/* モード切り替えボタン */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            グラフ表示
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            数字表示
          </button>
        </div>

        {/* ダウンロードボタン */}
        <div className="flex space-x-2">
          <button
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 5a2 2 0 012-2h1a1 1 0 000 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 100-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
            </svg>
            <span>Excel</span>
          </button>
          <button
            onClick={handlePDFDownload}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
            </svg>
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* グラフモード */}
      {viewMode === 'graph' && (
        <div className="w-full overflow-x-auto">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border border-gray-200 rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* テーブルモード */}
      {viewMode === 'table' && tableData && (
        <div className="w-full overflow-x-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {prefecture} ({year}年) 人口データ
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      年齢層
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      男性
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      女性
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      合計
                    </th>
                    {showCoopMembers && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wider">
                        組合員数
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, index) => (
                    <tr key={row.ageGroup} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.ageGroup}歳
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {row.malePopulation.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {row.femalePopulation.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {row.total.toLocaleString()}
                      </td>
                      {showCoopMembers && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right font-medium">
                          {row.coopMembers !== undefined ? `${row.coopMembers.toLocaleString()}` : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* 合計行 */}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      合計
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {tableData.reduce((sum, row) => sum + row.malePopulation, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {tableData.reduce((sum, row) => sum + row.femalePopulation, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {tableData.reduce((sum, row) => sum + row.total, 0).toLocaleString()}
                    </td>
                    {showCoopMembers && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-700 text-right">
                        {tableData.reduce((sum, row) => sum + (row.coopMembers || 0), 0).toLocaleString()}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* 単位表示 */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                ※ 人口は千人単位、組合員数は千人単位で表示
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopulationPyramid;