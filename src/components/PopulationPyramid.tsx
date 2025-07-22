import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { createPopulationPyramid, PyramidData } from '../utils/populationAnalysis';
import { LocalDataService } from '../services/localDataService';

interface PopulationPyramidProps {
  data: PopulationData[];
  width?: number;
  height?: number;
  prefecture?: string;
  year?: number;
  fixedScale?: number; // 2025年ベースの固定スケール
}

const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  data,
  width = 800,
  height = 600,
  prefecture = '',
  year = 2025,
  fixedScale
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!data || data.length === 0) return;

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
    
    // 初回描画か更新かを判定
    if (!isInitializedRef.current) {
      svg.selectAll("*").remove();
      drawPyramid(svg, pyramidData, width, height, prefecture, year, scale);
      isInitializedRef.current = true;
    } else {
      updatePyramid(svg, pyramidData, width, height, prefecture, year, scale);
    }
  }, [data, width, height, prefecture, year, fixedScale]);

  const updatePyramid = (
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

    // 男性バーの更新
    const maleBars = g.selectAll('.male-bar')
      .data(pyramidData.maleData);

    maleBars
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attr('x', d => xScale(d))
      .attr('width', d => xScale(0) - xScale(d));

    // 女性バーの更新
    const femaleBars = g.selectAll('.female-bar')
      .data(pyramidData.femaleData);

    femaleBars
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attr('width', d => xScale(d) - xScale(0));

    // X軸の更新
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => Math.abs(d as number).toLocaleString());

    g.select('.x-axis')
      .transition()
      .duration(800)
      .call(xAxis as any);

    // グリッドラインの更新
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat(() => '');

    g.select('.grid')
      .transition()
      .duration(800)
      .call(xAxisGrid as any);

    // 性別ラベルの位置更新
    g.select('.male-label')
      .transition()
      .duration(800)
      .attr('x', xScale(-maxValue * 0.7));

    g.select('.female-label')
      .transition()
      .duration(800)
      .attr('x', xScale(maxValue * 0.7));
  };

  const drawPyramid = (
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
      
    // スケール表示を削除

    // 男性バー（左側）
    const maleBars = g.selectAll('.male-bar')
      .data(pyramidData.maleData);
      
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
        // データから全国かどうか判定
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const population = isNational 
          ? Math.abs(d) * 1000 // 全国データ：APIで1000で割った後なので1000倍で実人数
          : Math.abs(d) * 1000; // 都道府県データ：千人単位なので1000倍で実人数
        
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
        // データから全国かどうか判定
        const isNational = data.length > 0 && data[0].prefectureCode === '00000';
        const population = isNational 
          ? d * 1000 // 全国データ：APIで1000で割った後なので1000倍で実人数
          : d * 1000; // 都道府県データ：千人単位なので1000倍で実人数
        
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