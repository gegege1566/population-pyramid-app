import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { CoopMemberData } from '../types/coopMember';
import { createPopulationPyramid } from '../utils/populationAnalysis';
import { LocalDataService } from '../services/localDataService';

// 年度比較グラフのアニメーション更新関数
export const updateOverlaidPyramidsWithAnimation = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data1: PopulationData[],
  data2: PopulationData[],
  coopData1: CoopMemberData[],
  coopData2: CoopMemberData[],
  containerWidth: number,
  year1: number,
  year2: number,
  showCoopMembers: boolean
) => {
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const width = containerWidth - 100;
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

  // メインコンテナを取得
  const g = svg.select('.chart-container') as d3.Selection<SVGGElement, unknown, null, undefined>;

  // アニメーション設定
  const transition = d3.transition()
    .duration(1200)
    .ease(d3.easeCubicInOut);

  // ツールチップ関数
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

  const hideTooltip = () => {
    d3.selectAll('.tooltip').remove();
  };

  // 年度1の男性バーを更新
  const maleBars2025 = g.selectAll('.male-bar-2025')
    .data(pyramid1.maleData);

  maleBars2025
    .transition(transition)
    .attr('x', d => xScale(d))
    .attr('width', d => xScale(0) - xScale(d))
    .attr('y', (d, i) => yScale(pyramid1.ageGroups[i])!)
    .attr('height', yScale.bandwidth());

  // 年度1の女性バーを更新
  const femaleBars2025 = g.selectAll('.female-bar-2025')
    .data(pyramid1.femaleData);

  femaleBars2025
    .transition(transition)
    .attr('width', d => xScale(d) - xScale(0))
    .attr('y', (d, i) => yScale(pyramid1.ageGroups[i])!)
    .attr('height', yScale.bandwidth());

  // 年度2の男性バーを更新
  const maleBars2035 = g.selectAll('.male-bar-2035')
    .data(pyramid2.maleData);

  maleBars2035
    .transition(transition)
    .attr('x', d => xScale(d))
    .attr('width', d => xScale(0) - xScale(d))
    .attr('y', (d, i) => yScale(pyramid2.ageGroups[i])!)
    .attr('height', yScale.bandwidth());

  // 年度2の女性バーを更新
  const femaleBars2035 = g.selectAll('.female-bar-2035')
    .data(pyramid2.femaleData);

  femaleBars2035
    .transition(transition)
    .attr('width', d => xScale(d) - xScale(0))
    .attr('y', (d, i) => yScale(pyramid2.ageGroups[i])!)
    .attr('height', yScale.bandwidth());

  // 中央線を更新
  g.select('line')
    .transition(transition)
    .attr('x1', xScale(0))
    .attr('x2', xScale(0))
    .attr('y2', chartHeight);

  // 軸を更新
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => Math.abs(d as number).toLocaleString());
  
  g.select('.x-axis')
    .transition(transition)
    .call(xAxis as any);

  const yAxis = d3.axisLeft(yScale);
  g.select('.y-axis')
    .transition(transition)
    .call(yAxis as any);

  // グリッドラインを更新
  const xAxisGrid = d3.axisBottom(xScale)
    .tickSize(-chartHeight)
    .tickFormat(() => '');
  
  g.select('.grid')
    .transition(transition)
    .call(xAxisGrid as any)
    .selectAll('line')
    .attr('stroke', '#E5E7EB')
    .attr('stroke-width', 0.5);

  // ツールチップのイベントハンドラーを再設定
  g.selectAll('.male-bar-2025')
    .on('mouseover', function(event, d) {
      const index = pyramid1.maleData.indexOf(d as number);
      showPopulationTooltip(event as MouseEvent, index, 'male');
    })
    .on('mouseout', hideTooltip);

  g.selectAll('.female-bar-2025')
    .on('mouseover', function(event, d) {
      const index = pyramid1.femaleData.indexOf(d as number);
      showPopulationTooltip(event as MouseEvent, index, 'female');
    })
    .on('mouseout', hideTooltip);

  g.selectAll('.male-bar-2035')
    .on('mouseover', function(event, d) {
      const index = pyramid2.maleData.indexOf(d as number);
      showPopulationTooltip(event as MouseEvent, index, 'male');
    })
    .on('mouseout', hideTooltip);

  g.selectAll('.female-bar-2035')
    .on('mouseover', function(event, d) {
      const index = pyramid2.femaleData.indexOf(d as number);
      showPopulationTooltip(event as MouseEvent, index, 'female');
    })
    .on('mouseout', hideTooltip);

  // 組合員バーの更新（必要に応じて）
  if (showCoopMembers && coopData1.length > 0 && coopData2.length > 0) {
    updateCoopMemberBarsWithAnimation(g, coopData1, coopData2, pyramid1, xScale, yScale, transition);
  }
};

// 組合員バーのアニメーション更新
const updateCoopMemberBarsWithAnimation = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  coopData1: CoopMemberData[],
  coopData2: CoopMemberData[],
  pyramid1: any,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleBand<string>,
  transition: d3.Transition<d3.BaseType, unknown, null, undefined>
) => {
  // 組合員数用ツールチップ
  const showCoopTooltip = (event: MouseEvent, ageGroup: string) => {
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
      2025年: ${(coop1 * 1000).toLocaleString()}人<br>
      2035年: ${(coop2 * 1000).toLocaleString()}人<br>
      増減: ${coopChange > 0 ? '+' : ''}${(coopChange * 1000).toLocaleString()}人 (${coopChangeRate > 0 ? '+' : ''}${coopChangeRate.toFixed(1)}%)
    `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const hideTooltip = () => {
    d3.selectAll('.tooltip').remove();
  };
  // 組合員データを年齢階級別に整理
  const membersByAge1: { [key: string]: number } = {};
  const membersByAge2: { [key: string]: number } = {};
  
  coopData1.forEach(d => {
    membersByAge1[d.ageGroup] = d.memberCount;
  });
  
  coopData2.forEach(d => {
    membersByAge2[d.ageGroup] = d.memberCount;
  });

  // 年度1の組合員バー（男性部分）を更新または作成
  let coopBars1Male = g.selectAll('.coop-bar-year1-male')
    .data(pyramid1.ageGroups);
  
  // 新規作成が必要な場合
  coopBars1Male.enter()
    .append('rect')
    .attr('class', 'coop-bar-year1-male')
    .attr('x', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(-memberCount / 2) : xScale(0);
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('width', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(0) - xScale(-memberCount / 2) : 0;
    })
    .attr('height', yScale.bandwidth())
    .attr('fill', '#F97316')
    .attr('opacity', 0.7)
    .style('pointer-events', 'all')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);
  
  // 既存のバーを更新
  g.selectAll('.coop-bar-year1-male')
    .transition(transition)
    .attr('x', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(-memberCount / 2) : xScale(0);
    })
    .attr('width', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(0) - xScale(-memberCount / 2) : 0;
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('height', yScale.bandwidth());

  // 年度1の組合員バー（女性部分）を更新または作成
  let coopBars1Female = g.selectAll('.coop-bar-year1-female')
    .data(pyramid1.ageGroups);
  
  // 新規作成が必要な場合
  coopBars1Female.enter()
    .append('rect')
    .attr('class', 'coop-bar-year1-female')
    .attr('x', xScale(0))
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('width', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(memberCount / 2) - xScale(0) : 0;
    })
    .attr('height', yScale.bandwidth())
    .attr('fill', '#F97316')
    .attr('opacity', 0.7)
    .style('pointer-events', 'all');
  
  // 既存のバーを更新
  g.selectAll('.coop-bar-year1-female')
    .transition(transition)
    .attr('x', xScale(0))
    .attr('width', (d: any) => {
      const memberCount = membersByAge1[d as string] || 0;
      return memberCount > 0 ? xScale(memberCount / 2) - xScale(0) : 0;
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('height', yScale.bandwidth());

  // イベントハンドラーを別途設定
  g.selectAll('.coop-bar-year1-female')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);

  // 年度2の組合員バー（男性部分）を更新または作成
  let coopBars2Male = g.selectAll('.coop-bar-year2-male')
    .data(pyramid1.ageGroups);
  
  // 新規作成が必要な場合
  coopBars2Male.enter()
    .append('rect')
    .attr('class', 'coop-bar-year2-male')
    .attr('x', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(-memberCount / 2) : xScale(0);
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('width', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(0) - xScale(-memberCount / 2) : 0;
    })
    .attr('height', yScale.bandwidth())
    .attr('fill', 'none')
    .attr('stroke', '#DC2626')
    .attr('stroke-width', 1.5)
    .style('pointer-events', 'all')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);
  
  // 既存のバーを更新
  g.selectAll('.coop-bar-year2-male')
    .transition(transition)
    .attr('x', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(-memberCount / 2) : xScale(0);
    })
    .attr('width', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(0) - xScale(-memberCount / 2) : 0;
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('height', yScale.bandwidth());

  // イベントハンドラーを別途設定
  g.selectAll('.coop-bar-year2-male')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);

  // 年度2の組合員バー（女性部分）を更新または作成
  let coopBars2Female = g.selectAll('.coop-bar-year2-female')
    .data(pyramid1.ageGroups);
  
  // 新規作成が必要な場合
  coopBars2Female.enter()
    .append('rect')
    .attr('class', 'coop-bar-year2-female')
    .attr('x', xScale(0))
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('width', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(memberCount / 2) - xScale(0) : 0;
    })
    .attr('height', yScale.bandwidth())
    .attr('fill', 'none')
    .attr('stroke', '#DC2626')
    .attr('stroke-width', 1.5)
    .style('pointer-events', 'all')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);
  
  // 既存のバーを更新
  g.selectAll('.coop-bar-year2-female')
    .transition(transition)
    .attr('x', xScale(0))
    .attr('width', (d: any) => {
      const memberCount = membersByAge2[d as string] || 0;
      return memberCount > 0 ? xScale(memberCount / 2) - xScale(0) : 0;
    })
    .attr('y', (d: any) => yScale(d as string)!)
    .attr('height', yScale.bandwidth());

  // イベントハンドラーを別途設定
  g.selectAll('.coop-bar-year2-female')
    .on('mouseover', function(event, d) {
      showCoopTooltip(event as MouseEvent, d as unknown as string);
    })
    .on('mouseout', hideTooltip);
};