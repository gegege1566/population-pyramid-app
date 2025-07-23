import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PopulationData } from '../types/population';
import { CoopMemberData } from '../types/coopMember';
import { createPopulationPyramid } from '../utils/populationAnalysis';
import { LocalDataService } from '../services/localDataService';
import { usePrefectureData } from '../hooks/usePrefectureData';
import { CoopMemberService } from '../services/coopMemberService';

interface YearComparisonDemoProps {
  selectedPrefCode: string;
  availableYears: number[];
  showCoopMembers: boolean;
  onCoopMembersChange: (show: boolean) => void;
}

const YearComparisonDemo: React.FC<YearComparisonDemoProps> = ({
  selectedPrefCode,
  availableYears,
  showCoopMembers,
  onCoopMembersChange
}) => {
  const [year1, setYear1] = useState(2025);
  const [year2, setYear2] = useState(2035);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [coopData1, setCoopData1] = useState<CoopMemberData[]>([]);
  const [coopData2, setCoopData2] = useState<CoopMemberData[]>([]);
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

  const { loadPrefectureData, getDataForYear, isDataAvailable, loading, preloading, currentPrefCode, fixedScale } = usePrefectureData();
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
      if (selectedPrefCode && showCoopMembers) {
        try {
          const data1 = await coopMemberService.getCoopMemberData(selectedPrefCode, year1);
          const data2 = await coopMemberService.getCoopMemberData(selectedPrefCode, year2);
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
  }, [selectedPrefCode, year1, year2, showCoopMembers, coopMemberService]);

  // 重ね描画用のピラミッドを描画
  const drawOverlaidPyramids = () => {
    if (!svgRef.current || !data1.length || !data2.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

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
      .attr('transform', `translate(${margin.left},${margin.top})`);

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
      .attr('opacity', 0.7);

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
      .attr('opacity', 0.7);

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
      .attr('stroke-dasharray', '3,3');

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
      .attr('stroke-dasharray', '3,3');

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
    if (showCoopMembers && coopData1.length > 0) {
      // 組合員データを年齢階級順に並べ替え
      const ageGroupOrder = pyramid1.ageGroups;
      const sortedCoopData1 = ageGroupOrder.map(age => 
        coopData1.find(d => d.ageGroup === age)?.memberCount || 0
      );
      const sortedCoopData2 = ageGroupOrder.map(age => 
        coopData2.find(d => d.ageGroup === age)?.memberCount || 0
      );

      // 組合員バー（人口ピラミッドと同じ太さで表示）
      // 第1年度 - 塗りつぶしオレンジ（左側・男性部分）
      g.selectAll('.coop-bar-year1-male')
        .data(sortedCoopData1)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year1-male')
        .attr('x', d => xScale(-Math.abs(d)))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => xScale(0) - xScale(-Math.abs(d)))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#F97316')
        .attr('opacity', 0.7);

      // 第1年度 - 塗りつぶしオレンジ（右側・女性部分）
      g.selectAll('.coop-bar-year1-female')
        .data(sortedCoopData1)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year1-female')
        .attr('x', xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => xScale(Math.abs(d)) - xScale(0))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#F97316')
        .attr('opacity', 0.7);

      // 第2年度 - 実線赤（左側・男性部分）
      g.selectAll('.coop-bar-year2-male')
        .data(sortedCoopData2)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year2-male')
        .attr('x', d => xScale(-Math.abs(d)))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => xScale(0) - xScale(-Math.abs(d)))
        .attr('height', yScale.bandwidth())
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5);

      // 第2年度 - 実線赤（右側・女性部分）
      g.selectAll('.coop-bar-year2-female')
        .data(sortedCoopData2)
        .enter()
        .append('rect')
        .attr('class', 'coop-bar-year2-female')
        .attr('x', xScale(0))
        .attr('y', (d, i) => yScale(ageGroupOrder[i])!)
        .attr('width', d => xScale(Math.abs(d)) - xScale(0))
        .attr('height', yScale.bandwidth())
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5);
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
    if (selectedPrefCode && availableYears.length > 0 && currentPrefCode !== selectedPrefCode) {
      loadPrefectureData(selectedPrefCode, availableYears);
    }
  }, [selectedPrefCode, availableYears, currentPrefCode, loadPrefectureData]);

  const data1 = getDataForYear(year1);
  const data2 = getDataForYear(year2);

  // データが準備できたら重ね描画を実行
  useEffect(() => {
    if (data1.length > 0 && data2.length > 0 && containerWidth > 0) {
      drawOverlaidPyramids();
    }
  }, [data1, data2, coopData1, coopData2, containerWidth, year1, year2, showCoopMembers]);
  const loading1 = loading || preloading || !isDataAvailable(year1);
  const loading2 = loading || preloading || !isDataAvailable(year2);

  const prefectureName = selectedPrefCode 
    ? require('../data/prefectures').PREFECTURE_CODES[selectedPrefCode] || '未選択'
    : '未選択';

  if (!selectedPrefCode) {
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

      {/* 比較解説 */}
      {!loading1 && !loading2 && data1.length > 0 && data2.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">比較のポイント:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 塗りつぶしのバーが{year1}年のデータ、点線囲みのバーが{year2}年のデータです</li>
            <li>• 両年度のデータを重ねて表示し、人口構成の変化を直接比較できます</li>
            <li>• {year2}年は{year1}年と比べて、少子高齢化の進行が視覚的に確認できます</li>
            {showCoopMembers && (
              <li>• オレンジ色のバーは組合員数推計で、人口データと同じスケールで中央に表示されます</li>
            )}
            <li>• グラフは左右一杯に表示され、詳細な変化を確認できます</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default YearComparisonDemo;