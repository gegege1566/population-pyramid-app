import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { CoopMemberData } from '../types/coopMember';
import { AgeGroupSpending, DEFAULT_AGE_GROUP_SPENDING } from '../types/coopSpending';
import { createPopulationPyramid } from '../utils/populationAnalysis';
import { LocalDataService } from '../services/localDataService';
import { usePrefectureData } from '../hooks/usePrefectureData';
import { useMultiplePrefectureData } from '../hooks/useMultiplePrefectureData';
import { CoopMemberService } from '../services/coopMemberService';
import { SpendingEstimationService } from '../services/spendingEstimationService';
import { downloadComparisonAsExcel, downloadComparisonAsPDF, ComparisonTableRowData } from '../utils/downloadUtils';
import { getSelectedPrefectureNames, getDetailedPrefectureNames, getAbbreviatedPrefectureNames, getPDFTitlePrefectureNames, getSafeFilenamePrefectureNames } from '../utils/prefectureUtils';
import { updateOverlaidPyramidsWithAnimation } from './YearComparisonDemo_animations';

interface YearComparisonDemoProps {
  selectedPrefCodes: string[];
  availableYears: number[];
  showCoopMembers: boolean;
  onCoopMembersChange: (show: boolean) => void;
  ageGroupSpending?: AgeGroupSpending[];
}

const YearComparisonDemo: React.FC<YearComparisonDemoProps> = ({
  selectedPrefCodes,
  availableYears,
  showCoopMembers,
  onCoopMembersChange,
  ageGroupSpending = DEFAULT_AGE_GROUP_SPENDING
}) => {
  const [year1, setYear1] = useState(2025);
  const [year2, setYear2] = useState(2035);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [coopData1, setCoopData1] = useState<CoopMemberData[]>([]);
  const [coopData2, setCoopData2] = useState<CoopMemberData[]>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 利用可能年度が更新されたら年度を調整
  useEffect(() => {
    if (availableYears.length > 0) {
      if (!availableYears.includes(year1)) {
        setYear1(availableYears.includes(2025) ? 2025 : availableYears[0]);
      }
      if (!availableYears.includes(year2)) {
        setYear2(availableYears.includes(2035) ? 2035 : availableYears[Math.min(availableYears.length - 1, 1)]);
      }
    }
  }, [availableYears, year1, year2]);

  // 選択状態に応じて適切なフックを使用
  const isMultipleSelection = selectedPrefCodes.length > 1;
  const singlePrefectureHook = usePrefectureData();
  const multiplePrefectureHook = useMultiplePrefectureData();
  const currentHook = isMultipleSelection ? multiplePrefectureHook : singlePrefectureHook;
  
  const { getDataForYear, isDataAvailable, loading, fixedScale } = currentHook;
  
  // preloadingは単一選択時のみ存在
  const preloading = isMultipleSelection ? false : (singlePrefectureHook as any).preloading;
  const coopMemberService = CoopMemberService.getInstance();

  // コンテナ幅を取得してグラフサイズを計算
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 組合員データを読み込み
  useEffect(() => {
    const loadCoopData = async () => {
      if (selectedPrefCodes.length > 0 && showCoopMembers) {
        try {
          const data1 = await coopMemberService.getMultipleCoopMemberData(selectedPrefCodes, year1);
          const data2 = await coopMemberService.getMultipleCoopMemberData(selectedPrefCodes, year2);
          setCoopData1(data1);
          setCoopData2(data2);
        } catch (error) {
          console.error('組合員データの読み込みに失敗:', error);
          setCoopData1([]);
          setCoopData2([]);
        }
      } else {
        setCoopData1([]);
        setCoopData2([]);
      }
    };

    loadCoopData();
  }, [selectedPrefCodes, year1, year2, showCoopMembers, coopMemberService]);

  // 重ね描画用のピラミッドを描画
  const drawOverlaidPyramids = () => {
    if (!svgRef.current || !data1.length || !data2.length) return;

    const svg = d3.select(svgRef.current);
    
    // 初回描画かどうかを判定
    const isInitialDraw = svg.select('.chart-container').empty();
    
    // エリア変更時は常に再描画（組合員データの表示を確実にするため）
    const hasAreaChanged = svgRef.current.getAttribute('data-areas') !== selectedPrefCodes.join(',');
    
    if (isInitialDraw || hasAreaChanged) {
      svg.selectAll("*").remove();
      drawInitialOverlaidPyramids(svg);
      // エリア情報を記録
      svgRef.current.setAttribute('data-areas', selectedPrefCodes.join(','));
    } else {
      updateOverlaidPyramidsWithAnimation(
        svg,
        data1,
        data2,
        coopData1,
        coopData2,
        containerWidth,
        year1,
        year2,
        showCoopMembers
      );
    }
  };

  // 初回描画
  const drawInitialOverlaidPyramids = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {

    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const width = containerWidth - 100; // 左右一杯に表示
    const height = 600;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const pyramid1 = createPopulationPyramid(data1);
    const pyramid2 = createPopulationPyramid(data2);

    // 両年度のデータから最大値を計算
    const localDataService = new LocalDataService();
    const scale1 = localDataService.calculateDynamicScale(data1);
    const scale2 = localDataService.calculateDynamicScale(data2);
    const maxValue = Math.max(scale1, scale2);

    // スケール設定
    const xScale = d3.scaleLinear()
      .domain([-maxValue, maxValue])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(pyramid1.ageGroups)
      .range([0, chartHeight])
      .padding(0.1);

    // メインコンテナ
    const g = svg.append('g')
      .attr('class', 'chart-container')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 人口データ用ツールチップ
    const showPopulationTooltip = (event: MouseEvent, ageIndex: number, gender: 'male' | 'female') => {
      const ageGroup = pyramid1.ageGroups[ageIndex];
      const pop1Male = Math.abs(pyramid1.maleData[ageIndex]);
      const pop1Female = pyramid1.femaleData[ageIndex];
      const pop2Male = Math.abs(pyramid2.maleData[ageIndex]);
      const pop2Female = pyramid2.femaleData[ageIndex];
      
      const pop1Selected = gender === 'male' ? pop1Male : pop1Female;
      const pop2Selected = gender === 'male' ? pop2Male : pop2Female;
      const popChange = pop2Selected - pop1Selected;
      const popChangeRate = pop1Selected > 0 ? ((popChange / pop1Selected) * 100) : 0;
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
        .style('max-width', '300px');

      tooltip.html(`
        <strong>${ageGroup}歳 ${gender === 'male' ? '男性' : '女性'}</strong><br><br>
        <strong>人口（${gender === 'male' ? '男性' : '女性'}）:</strong><br>
        ${year1}年: ${pop1Selected.toLocaleString()}千人<br>
        ${year2}年: ${pop2Selected.toLocaleString()}千人<br>
        増減: ${popChange > 0 ? '+' : ''}${popChange.toLocaleString()}千人 (${popChangeRate > 0 ? '+' : ''}${popChangeRate.toFixed(1)}%)
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    };

    // 組合員数用ツールチップ
    const showCoopTooltip = (event: MouseEvent, ageIndex: number) => {
      const ageGroup = pyramid1.ageGroups[ageIndex];
      const coop1 = coopData1.find(d => d.ageGroup === ageGroup)?.memberCount || 0;
      const coop2 = coopData2.find(d => d.ageGroup === ageGroup)?.memberCount || 0;
      const coopChange = coop2 - coop1;
      const coopChangeRate = coop1 > 0 ? ((coopChange / coop1) * 100) : 0;
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(255, 111, 53, 0.95)') // オレンジ系の背景色
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
        .style('max-width', '300px');

      tooltip.html(`
        <strong>${ageGroup}歳 組合員数（男女計）</strong><br><br>
        ${year1}年: ${(coop1 * 1000).toLocaleString()}人<br>
        ${year2}年: ${(coop2 * 1000).toLocaleString()}人<br>
        増減: ${coopChange > 0 ? '+' : ''}${(coopChange * 1000).toLocaleString()}人 (${coopChangeRate > 0 ? '+' : ''}${coopChangeRate.toFixed(1)}%)
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    };

    const hideTooltip = () => {
      d3.selectAll('.tooltip').remove();
    };

    // 2025年のバー（塗りつぶし）
    g.selectAll('.male-bar-2025')
      .data(pyramid1.maleData)
      .enter()
      .append('rect')
      .attr('class', 'male-bar-2025')
      .attr('x', d => xScale(d))
      .attr('y', (d, i) => yScale(pyramid1.ageGroups[i])!)
      .attr('width', d => xScale(0) - xScale(d))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#3B82F6')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const index = pyramid1.maleData.indexOf(d);
        showPopulationTooltip(event as MouseEvent, index, 'male');
      })
      .on('mouseout', hideTooltip);

    g.selectAll('.female-bar-2025')
      .data(pyramid1.femaleData)
      .enter()
      .append('rect')
      .attr('class', 'female-bar-2025')
      .attr('x', xScale(0))
      .attr('y', (d, i) => yScale(pyramid1.ageGroups[i])!)
      .attr('width', d => xScale(d) - xScale(0))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#EC4899')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const index = pyramid1.femaleData.indexOf(d);
        showPopulationTooltip(event as MouseEvent, index, 'female');
      })
      .on('mouseout', hideTooltip);

    // 2035年のバー（点線囲み、透明）
    g.selectAll('.male-bar-2035')
      .data(pyramid2.maleData)
      .enter()
      .append('rect')
      .attr('class', 'male-bar-2035')
      .attr('x', d => xScale(d))
      .attr('y', (d, i) => yScale(pyramid2.ageGroups[i])!)
      .attr('width', d => xScale(0) - xScale(d))
      .attr('height', yScale.bandwidth())
      .attr('fill', 'none')
      .attr('stroke', '#1E40AF')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const index = pyramid2.maleData.indexOf(d);
        showPopulationTooltip(event as MouseEvent, index, 'male');
      })
      .on('mouseout', hideTooltip);

    g.selectAll('.female-bar-2035')
      .data(pyramid2.femaleData)
      .enter()
      .append('rect')
      .attr('class', 'female-bar-2035')
      .attr('x', xScale(0))
      .attr('y', (d, i) => yScale(pyramid2.ageGroups[i])!)
      .attr('width', d => xScale(d) - xScale(0))
      .attr('height', yScale.bandwidth())
      .attr('fill', 'none')
      .attr('stroke', '#BE185D')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const index = pyramid2.femaleData.indexOf(d);
        showPopulationTooltip(event as MouseEvent, index, 'female');
      })
      .on('mouseout', hideTooltip);

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
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // X軸（人口）
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => Math.abs(d as number).toLocaleString());
    
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // 組合員データのオーバーレイ表示
    if (showCoopMembers && coopData1.length > 0 && coopData2.length > 0) {
      // 組合員データを年齢階級順に並べ替え
      const ageGroupOrder = pyramid1.ageGroups;
      const sortedCoopData1 = ageGroupOrder.map(age => 
        coopData1.find(d => d.ageGroup === age)?.memberCount || 0
      );
      const sortedCoopData2 = ageGroupOrder.map(age => 
        coopData2.find(d => d.ageGroup === age)?.memberCount || 0
      );

      // 組合員バー（人口ピラミッドと同じ太さで表示）
      // 男女半々として表示（組合員数を2で割る）
      // 第1年度 - 塗りつぶしオレンジ（左側・男性部分）
      g.selectAll('.coop-bar-year1-male')
        .data(sortedCoopData1)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year1-male')
        .attr('x', d => d > 0 ? xScale(-d / 2) : xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => d > 0 ? xScale(0) - xScale(-d / 2) : 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#F97316')
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          const index = sortedCoopData1.indexOf(d);
          showCoopTooltip(event as MouseEvent, index);
        })
        .on('mouseout', hideTooltip);

      // 第1年度 - 塗りつぶしオレンジ（右側・女性部分）
      g.selectAll('.coop-bar-year1-female')
        .data(sortedCoopData1)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year1-female')
        .attr('x', xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => d > 0 ? xScale(d / 2) - xScale(0) : 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#F97316')
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          const index = sortedCoopData1.indexOf(d);
          showCoopTooltip(event as MouseEvent, index);
        })
        .on('mouseout', hideTooltip);

      // 第2年度 - 実線赤（左側・男性部分）
      g.selectAll('.coop-bar-year2-male')
        .data(sortedCoopData2)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year2-male')
        .attr('x', d => d > 0 ? xScale(-d / 2) : xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => d > 0 ? xScale(0) - xScale(-d / 2) : 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          const index = sortedCoopData2.indexOf(d);
          showCoopTooltip(event as MouseEvent, index);
        })
        .on('mouseout', hideTooltip);

      // 第2年度 - 実線赤（右側・女性部分）
      g.selectAll('.coop-bar-year2-female')
        .data(sortedCoopData2)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year2-female')
        .attr('x', xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => d > 0 ? xScale(d / 2) - xScale(0) : 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          const index = sortedCoopData2.indexOf(d);
          showCoopTooltip(event as MouseEvent, index);
        })
        .on('mouseout', hideTooltip);
    }

    // 軸ラベル
    g.append('text')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('年齢階級');

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('人口 (千人単位)');

    // 性別ラベル
    g.append('text')
      .attr('x', xScale(-maxValue * 0.7))
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#3B82F6')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('男性');

    g.append('text')
      .attr('x', xScale(maxValue * 0.7))
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#EC4899')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('女性');

    // 凡例（下部中央に表示）
    const legendStartY = showCoopMembers ? chartHeight + 60 : chartHeight + 60;
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth / 2 - 250}, ${legendStartY})`);

    // 人口凡例
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('人口:');

    // 男性凡例
    legend.append('text')
      .attr('x', 40)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .attr('fill', '#3B82F6')
      .text('男性');

    legend.append('rect')
      .attr('x', 75)
      .attr('y', -12)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', '#3B82F6')
      .attr('opacity', 0.7);

    legend.append('text')
      .attr('x', 100)
      .attr('y', -2)
      .style('font-size', '10px')
      .text(`${year1}年`);

    legend.append('rect')
      .attr('x', 135)
      .attr('y', -12)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', 'none')
      .attr('stroke', '#1E40AF')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    legend.append('text')
      .attr('x', 160)
      .attr('y', -2)
      .style('font-size', '10px')
      .text(`${year2}年`);

    // 女性凡例
    legend.append('text')
      .attr('x', 200)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .attr('fill', '#EC4899')
      .text('女性');

    legend.append('rect')
      .attr('x', 235)
      .attr('y', -12)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', '#EC4899')
      .attr('opacity', 0.7);

    legend.append('text')
      .attr('x', 260)
      .attr('y', -2)
      .style('font-size', '10px')
      .text(`${year1}年`);

    legend.append('rect')
      .attr('x', 295)
      .attr('y', -12)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', 'none')
      .attr('stroke', '#BE185D')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    legend.append('text')
      .attr('x', 320)
      .attr('y', -2)
      .style('font-size', '10px')
      .text(`${year2}年`);

    // 組合員凡例（表示時のみ）
    if (showCoopMembers) {
      legend.append('text')
        .attr('x', 380)
        .attr('y', 0)
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .attr('fill', '#F97316')
        .text('組合員:');

      legend.append('rect')
        .attr('x', 430)
        .attr('y', -12)
        .attr('width', 20)
        .attr('height', 12)
        .attr('fill', '#F97316')
        .attr('opacity', 0.7);

      legend.append('text')
        .attr('x', 455)
        .attr('y', -2)
        .style('font-size', '10px')
        .text(`${year1}年`);

      legend.append('rect')
        .attr('x', 490)
        .attr('y', -12)
        .attr('width', 20)
        .attr('height', 12)
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5);

      legend.append('text')
        .attr('x', 515)
        .attr('y', -2)
        .style('font-size', '10px')
        .text(`${year2}年`);
    }
  };

  // 都道府県変更時にデータをプリロード
  useEffect(() => {
    if (selectedPrefCodes.length > 0 && availableYears.length > 0) {
      if (isMultipleSelection) {
        // 複数選択の場合
        const currentCodesStr = multiplePrefectureHook.currentPrefCodes.sort().join(',');
        const selectedCodesStr = selectedPrefCodes.sort().join(',');
        if (currentCodesStr !== selectedCodesStr) {
          multiplePrefectureHook.loadMultiplePrefectureData(selectedPrefCodes, availableYears);
        }
      } else {
        // 単一選択の場合
        const prefCode = selectedPrefCodes[0];
        if (singlePrefectureHook.currentPrefCode !== prefCode) {
          singlePrefectureHook.loadPrefectureData(prefCode, availableYears);
        }
      }
    }
  }, [selectedPrefCodes, availableYears, isMultipleSelection, singlePrefectureHook, multiplePrefectureHook]);

  const data1 = getDataForYear(year1);
  const data2 = getDataForYear(year2);

  // データが準備できたら重ね描画を実行
  useEffect(() => {
    if (data1.length > 0 && data2.length > 0 && containerWidth > 0 && viewMode === 'graph') {
      drawOverlaidPyramids();
    }
  }, [data1, data2, coopData1, coopData2, containerWidth, year1, year2, showCoopMembers, viewMode]);
  const loading1 = loading || preloading || !isDataAvailable(year1);
  const loading2 = loading || preloading || !isDataAvailable(year2);

  // 表示用地域名（UI表示用）
  const prefectureName = getSelectedPrefectureNames(selectedPrefCodes);
  // 詳細地域名（Excel用）
  const detailedPrefectureName = getDetailedPrefectureNames(selectedPrefCodes);
  // 省略形地域名（シート名・タイトル用）
  const abbreviatedPrefectureName = getAbbreviatedPrefectureNames(selectedPrefCodes);
  // PDF用タイトル地域名
  const pdfTitlePrefectureName = getPDFTitlePrefectureNames(selectedPrefCodes);
  // ファイル名用地域名
  const filenamePrefectureName = getSafeFilenamePrefectureNames(selectedPrefCodes);

  // 比較テーブルデータを準備
  const getComparisonTableData = (): ComparisonTableRowData[] | null => {
    if (!data1.length || !data2.length) return null;
    
    const pyramidData1 = createPopulationPyramid(data1);
    const pyramidData2 = createPopulationPyramid(data2);
    const ageGroups = pyramidData1.ageGroups;

    return ageGroups.map((ageGroup, index) => {
      const male1 = Math.abs(pyramidData1.maleData[index]);
      const female1 = pyramidData1.femaleData[index];
      const total1 = male1 + female1;
      const male2 = Math.abs(pyramidData2.maleData[index]);
      const female2 = pyramidData2.femaleData[index];
      const total2 = male2 + female2;

      const changeRate = total1 > 0 ? ((total2 - total1) / total1 * 100) : 0;
      const changeAmount = total2 - total1;

      return {
        ageGroup,
        male1,
        female1,
        total1,
        male2,
        female2,
        total2,
        changeRate,
        changeAmount
      };
    });
  };

  // 組合員詳細データを準備する関数
  const getCoopDetailData = () => {
    if (!showCoopMembers || !coopData1.length || !coopData2.length) return null;
    
    const pyramidData1 = createPopulationPyramid(data1);
    const ageGroups = pyramidData1.ageGroups;

    // 組合員データを年齢階級別に整理
    const membersByAge1: { [key: string]: number } = {};
    const membersByAge2: { [key: string]: number } = {};
    
    coopData1.forEach(d => {
      membersByAge1[d.ageGroup] = d.memberCount;
    });
    
    coopData2.forEach(d => {
      membersByAge2[d.ageGroup] = d.memberCount;
    });

    // 総組合員数を計算
    const total1 = Object.values(membersByAge1).reduce((sum, count) => sum + count, 0);
    const total2 = Object.values(membersByAge2).reduce((sum, count) => sum + count, 0);

    return ageGroups.map(ageGroup => {
      const count1 = membersByAge1[ageGroup] || 0;
      const count2 = membersByAge2[ageGroup] || 0;
      const change = count2 - count1;
      const changeRate = count1 > 0 ? ((change / count1) * 100) : 0;
      
      // 構成比を計算
      const ratio1 = total1 > 0 ? (count1 / total1) * 100 : 0;
      const ratio2 = total2 > 0 ? (count2 / total2) * 100 : 0;

      // 年間利用額を取得
      const ageGroupSpendingData = ageGroupSpending.find(s => s.ageGroup === ageGroup);
      const annualSpending = ageGroupSpendingData ? ageGroupSpendingData.annualSpending : 0;

      // 総利用額を計算（千人単位 × 1000人 × 年間利用額）
      const totalSpending1 = (count1 * 1000 * annualSpending) / 1000000; // 百万円単位
      const totalSpending2 = (count2 * 1000 * annualSpending) / 1000000; // 百万円単位
      const spendingChange = totalSpending2 - totalSpending1; // 百万円単位の増減

      return {
        ageGroup,
        count1: count1 * 1000, // 実人数
        count2: count2 * 1000, // 実人数
        change: change * 1000, // 実人数の増減
        changeRate,
        ratio1,
        ratio2,
        annualSpending,
        totalSpending1,
        totalSpending2,
        spendingChange
      };
    });
  };

  // ダウンロード機能
  const handleExcelDownload = () => {
    const tableData = getComparisonTableData();
    const coopDetailData = getCoopDetailData();
    if (tableData) {
      downloadComparisonAsExcel(tableData, detailedPrefectureName, year1, year2, false, abbreviatedPrefectureName, coopDetailData, ageGroupSpending);
    }
  };

  const handlePDFDownload = () => {
    if (svgRef.current) {
      downloadComparisonAsPDF(svgRef.current, pdfTitlePrefectureName, year1, year2);
    }
  };

  if (selectedPrefCodes.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        都道府県を選択してください
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          年度比較表示 - {prefectureName}
        </h3>
        <div className="text-sm text-gray-600 mb-4">
          ※各年度のデータから動的にスケールを計算し、詳細な人口変化を可視化
        </div>

        {/* 組合員表示切り替え */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCoopMembers}
              onChange={(e) => onCoopMembersChange(e.target.checked)}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">組合員数推計を表示</span>
          </label>
        </div>

        {/* モード切り替えとダウンロードボタン */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
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
        
        {/* 年度選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較年度1（将来推計）
            </label>
            <select
              value={year1}
              onChange={(e) => setYear1(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}年（推計）</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              比較年度2（将来推計）
            </label>
            <select
              value={year2}
              onChange={(e) => setYear2(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}年（推計）</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(loading1 || loading2) && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600">データを読み込んでいます...</div>
          </div>
        </div>
      )}

      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && (
        <>
          {/* グラフモード */}
          {viewMode === 'graph' && (
            <div className="overflow-x-auto">
              <div className="flex justify-center">
                <svg
                  ref={svgRef}
                  width={containerWidth - 100}
                  height={680}
                  className="border border-gray-200 rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* テーブルモード */}
          {viewMode === 'table' && (
            <div className="w-full overflow-x-auto">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {prefectureName} 年度比較データ ({year1}年 vs {year2}年)
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
                          {year1}年 男性
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year1}年 女性
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year1}年 合計
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year2}年 男性
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year2}年 女性
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year2}年 合計
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wider">
                          変化率
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wider">
                          増減数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const pyramidData1 = createPopulationPyramid(data1);
                        const pyramidData2 = createPopulationPyramid(data2);
                        const ageGroups = pyramidData1.ageGroups;

                        return ageGroups.map((ageGroup, index) => {
                          // pyramidDataから年齢別の人口データを取得
                          const male1 = Math.abs(pyramidData1.maleData[index]); // 負値を正値に変換
                          const female1 = pyramidData1.femaleData[index];
                          const total1 = male1 + female1;
                          const male2 = Math.abs(pyramidData2.maleData[index]); // 負値を正値に変換
                          const female2 = pyramidData2.femaleData[index];
                          const total2 = male2 + female2;

                          const changeRate = total1 > 0 ? ((total2 - total1) / total1 * 100) : 0;
                          const changeAmount = total2 - total1;

                          return (
                            <tr key={ageGroup} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {ageGroup}歳
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {male1.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {female1.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                {total1.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {male2.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {female2.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                {total2.toLocaleString()}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                changeRate >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                changeAmount >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {changeAmount >= 0 ? '+' : ''}{changeAmount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                      {(() => {
                        // 合計行を計算
                        const pyramidData1 = createPopulationPyramid(data1);
                        const pyramidData2 = createPopulationPyramid(data2);
                        
                        // 各年度の合計を計算
                        const totalMale1 = pyramidData1.maleData.reduce((sum, value) => sum + Math.abs(value), 0);
                        const totalFemale1 = pyramidData1.femaleData.reduce((sum, value) => sum + value, 0);
                        const grandTotal1 = totalMale1 + totalFemale1;
                        
                        const totalMale2 = pyramidData2.maleData.reduce((sum, value) => sum + Math.abs(value), 0);
                        const totalFemale2 = pyramidData2.femaleData.reduce((sum, value) => sum + value, 0);
                        const grandTotal2 = totalMale2 + totalFemale2;
                        
                        const totalChangeRate = grandTotal1 > 0 ? ((grandTotal2 - grandTotal1) / grandTotal1 * 100) : 0;
                        const totalChangeAmount = grandTotal2 - grandTotal1;
                        
                        return (
                          <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              合計
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {totalMale1.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {totalFemale1.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {grandTotal1.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {totalMale2.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {totalFemale2.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {grandTotal2.toLocaleString()}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                              totalChangeRate >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {totalChangeRate >= 0 ? '+' : ''}{totalChangeRate.toFixed(1)}%
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                              totalChangeAmount >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {totalChangeAmount >= 0 ? '+' : ''}{totalChangeAmount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })()}
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
        </>
      )}

      {/* 組合員供給金額比較 */}
      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && showCoopMembers && coopData1.length > 0 && coopData2.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            組合員供給金額比較
          </h3>
            
            {(() => {
              // 年度別の供給金額を計算
              const estimation1 = SpendingEstimationService.estimateTotalSpending(
                coopData1,
                ageGroupSpending,
                year1
              );
              const estimation2 = SpendingEstimationService.estimateTotalSpending(
                coopData2,
                ageGroupSpending,
                year2
              );
              
              const changeAmount = estimation2.totalAmount - estimation1.totalAmount;
              const changeRate = SpendingEstimationService.calculateChangeRate(estimation1, estimation2);
              
              // 年齢層別構成比を計算
              const shares1 = SpendingEstimationService.calculateAgeGroupShare(estimation1);
              const shares2 = SpendingEstimationService.calculateAgeGroupShare(estimation2);
              
              // 構成比の変化が大きい年齢層を取得
              const shareChanges = Array.from(shares1.keys()).map(ageGroup => {
                const share1 = shares1.get(ageGroup) || 0;
                const share2 = shares2.get(ageGroup) || 0;
                return {
                  ageGroup,
                  share1,
                  share2,
                  change: share2 - share1
                };
              }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
              
              return (
                <>
                  {/* 総供給金額の比較 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">{year1}年</div>
                      <div className="text-xl font-bold text-blue-900">
                        {estimation1.totalAmount.toLocaleString('ja-JP', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} 百万円
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">{year2}年</div>
                      <div className="text-xl font-bold text-green-900">
                        {estimation2.totalAmount.toLocaleString('ja-JP', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} 百万円
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${changeAmount >= 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <div className="text-sm text-gray-600">増減</div>
                      <div className={`text-xl font-bold ${changeAmount >= 0 ? 'text-orange-900' : 'text-gray-900'}`}>
                        {changeAmount >= 0 ? '+' : ''}{changeAmount.toLocaleString('ja-JP', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} 百万円
                      </div>
                      <div className={`text-sm ${changeAmount >= 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                        ({changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  
                  {/* 構成比の変化が大きい年齢層 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      構成比変化の大きい年齢層（上位3層）
                    </h4>
                    <div className="space-y-2">
                      {shareChanges.map(({ ageGroup, share1, share2, change }) => (
                        <div key={ageGroup} className="flex items-center text-sm">
                          <div className="w-20">{ageGroup}歳</div>
                          <div className="flex-1 mx-2">
                            <div className="flex items-center">
                              <div className="text-gray-600">{share1.toFixed(1)}%</div>
                              <div className="mx-2">→</div>
                              <div className="font-medium">{share2.toFixed(1)}%</div>
                              <div className={`ml-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({change >= 0 ? '+' : ''}{change.toFixed(1)}pt)
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    ※ 年齢別利用金額設定に基づく推定値です
                  </div>
                </>
              );
            })()}
        </div>
      )}

      {/* 組合員年齢層別詳細比較 */}
      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && showCoopMembers && coopData1.length > 0 && coopData2.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              組合員数年齢層別詳細比較 ({year1}年 vs {year2}年)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年齢層
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wider">
                    {year1}年 組合員数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-orange-500 uppercase tracking-wider">
                    {year2}年 組合員数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wider">
                    増減数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-500 uppercase tracking-wider">
                    変化率
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-green-500 uppercase tracking-wider">
                    {year1}年 構成比
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-green-500 uppercase tracking-wider">
                    {year2}年 構成比
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-purple-500 uppercase tracking-wider">
                    年間利用額
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-purple-500 uppercase tracking-wider">
                    {year1}年 総額
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-purple-500 uppercase tracking-wider">
                    {year2}年 総額
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-red-500 uppercase tracking-wider">
                    利用額増減
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // 年齢階級の一覧を取得
                  const pyramidData1 = createPopulationPyramid(data1);
                  const ageGroups = pyramidData1.ageGroups;

                  // 組合員データを年齢階級別に整理
                  const membersByAge1: { [key: string]: number } = {};
                  const membersByAge2: { [key: string]: number } = {};
                  
                  coopData1.forEach(d => {
                    membersByAge1[d.ageGroup] = d.memberCount;
                  });
                  
                  coopData2.forEach(d => {
                    membersByAge2[d.ageGroup] = d.memberCount;
                  });

                  // 総組合員数を計算
                  const total1 = Object.values(membersByAge1).reduce((sum, count) => sum + count, 0);
                  const total2 = Object.values(membersByAge2).reduce((sum, count) => sum + count, 0);

                  return ageGroups.map((ageGroup, index) => {
                    const count1 = membersByAge1[ageGroup] || 0;
                    const count2 = membersByAge2[ageGroup] || 0;
                    const change = count2 - count1;
                    const changeRate = count1 > 0 ? ((change / count1) * 100) : 0;
                    
                    // 構成比を計算
                    const ratio1 = total1 > 0 ? (count1 / total1) * 100 : 0;
                    const ratio2 = total2 > 0 ? (count2 / total2) * 100 : 0;

                    // 年間利用額を取得
                    const ageGroupSpendingData = ageGroupSpending.find(s => s.ageGroup === ageGroup);
                    const annualSpending = ageGroupSpendingData ? ageGroupSpendingData.annualSpending : 0;

                    // 総利用額を計算（千人単位 × 1000人 × 年間利用額）
                    const totalSpending1 = (count1 * 1000 * annualSpending) / 1000000; // 百万円単位
                    const totalSpending2 = (count2 * 1000 * annualSpending) / 1000000; // 百万円単位
                    const spendingChange = totalSpending2 - totalSpending1; // 百万円単位の増減

                    return (
                      <tr key={ageGroup} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ageGroup}歳
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                          {count1 > 0 ? (count1 * 1000).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                          {count2 > 0 ? (count2 * 1000).toLocaleString() : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          change >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {change !== 0 ? `${change >= 0 ? '+' : ''}${(change * 1000).toLocaleString()}` : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          changeRate >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {count1 > 0 ? `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                          {ratio1 > 0 ? `${ratio1.toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                          {ratio2 > 0 ? `${ratio2.toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">
                          ¥{annualSpending.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">
                          {totalSpending1 > 0 ? `${totalSpending1.toFixed(0)}百万円` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">
                          {totalSpending2 > 0 ? `${totalSpending2.toFixed(0)}百万円` : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          spendingChange >= 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {(totalSpending1 > 0 || totalSpending2 > 0) ? 
                            `${spendingChange >= 0 ? '+' : ''}${spendingChange.toFixed(0)}百万円` : '-'}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {/* 合計行 */}
                {(() => {
                  const total1 = coopData1.reduce((sum, item) => sum + item.memberCount, 0);
                  const total2 = coopData2.reduce((sum, item) => sum + item.memberCount, 0);
                  const totalChange = total2 - total1;
                  const totalChangeRate = total1 > 0 ? ((totalChange / total1) * 100) : 0;

                  // 総利用額を計算
                  const estimation1 = SpendingEstimationService.estimateTotalSpending(coopData1, ageGroupSpending, year1);
                  const estimation2 = SpendingEstimationService.estimateTotalSpending(coopData2, ageGroupSpending, year2);
                  const totalSpendingChange = estimation2.totalAmount - estimation1.totalAmount;

                  return (
                    <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        合計
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-700 text-right">
                        {(total1 * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-700 text-right">
                        {(total2 * 1000).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        totalChange >= 0 ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {totalChange >= 0 ? '+' : ''}{(totalChange * 1000).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        totalChangeRate >= 0 ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {totalChangeRate >= 0 ? '+' : ''}{totalChangeRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">
                        100.0%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">
                        100.0%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700 text-right">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700 text-right">
                        {estimation1.totalAmount.toFixed(0)}百万円
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700 text-right">
                        {estimation2.totalAmount.toFixed(0)}百万円
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        totalSpendingChange >= 0 ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {totalSpendingChange >= 0 ? '+' : ''}{totalSpendingChange.toFixed(0)}百万円
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          
          {/* 注釈 */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              ※ 組合員数は実人数、構成比は各年度内での比率、利用額は年間設定金額に基づく推定値、利用額増減は2つの年度の総額差分
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearComparisonDemo;