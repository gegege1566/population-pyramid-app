import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { createPopulationPyramid, PyramidData } from '../utils/populationAnalysis';

interface PopulationPyramidProps {
  data: PopulationData[];
  width?: number;
  height?: number;
  prefecture?: string;
  year?: number;
}

const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  data,
  width = 800,
  height = 600,
  prefecture = '',
  year = 2020
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 既存の要素をクリア

    const pyramidData = createPopulationPyramid(data);
    drawPyramid(svg, pyramidData, width, height, prefecture, year);
  }, [data, width, height, prefecture, year]);

  const drawPyramid = (
    svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
    pyramidData: PyramidData,
    width: number,
    height: number,
    prefecture: string,
    year: number
  ) => {
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 固定スケール設定（年度間比較を可能にするため）
    // データは千人単位なので、適切な固定上限を設定
    const FIXED_MAX_VALUE = 600; // 60万人（千人単位）= 600,000人
    
    // 動的な最大値も計算（デバッグ用）
    const dynamicMaxValue = Math.max(
      ...pyramidData.maleData.map(Math.abs),
      ...pyramidData.femaleData
    );
    
    // 固定値を使用
    const maxValue = FIXED_MAX_VALUE;

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
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // タイトル（将来推計の場合は明示）
    const currentYear = new Date().getFullYear();
    const isFutureData = year > currentYear;
    const titleSuffix = isFutureData ? '年 将来推計' : '年';
    
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-lg font-bold')
      .attr('fill', isFutureData ? '#7C3AED' : '#1F2937')
      .text(`${prefecture} 人口ピラミッド (${year}${titleSuffix})`);
      
    // スケール固定の説明
    svg.append('text')
      .attr('x', width - 10)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .attr('class', 'text-xs')
      .attr('fill', '#6B7280')
      .text('※スケール固定（年度比較可能）');

    // 男性バー（左側）
    g.selectAll('.male-bar')
      .data(pyramidData.maleData)
      .enter()
      .append('rect')
      .attr('class', 'male-bar')
      .attr('x', d => xScale(d))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('width', d => xScale(0) - xScale(d))
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
        const population = Math.abs(d) * 1000; // 千人単位から人単位に変換
        
        tooltip.html(`男性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

    // 女性バー（右側）
    g.selectAll('.female-bar')
      .data(pyramidData.femaleData)
      .enter()
      .append('rect')
      .attr('class', 'female-bar')
      .attr('x', xScale(0))
      .attr('y', (d, i) => yScale(pyramidData.ageGroups[i])!)
      .attr('width', d => xScale(d) - xScale(0))
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
        const population = d * 1000; // 千人単位から人単位に変換
        
        tooltip.html(`女性 ${ageGroup}歳<br/>${population.toLocaleString()}人`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

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
      .text('人口 (千人単位、最大値: 60万人固定)');

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
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
    </div>
  );
};

export default PopulationPyramid;