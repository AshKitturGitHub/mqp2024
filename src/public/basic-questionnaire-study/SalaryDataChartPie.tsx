/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';

// Define the type for salary data
interface SalaryData {
  userID: number;
  salary: number;
}

export function PieChart({ parameters, setAnswer }: { parameters: { data: string }, setAnswer: ({ status, provenanceGraph, answers }: { status: boolean, provenanceGraph?: any, answers: Record<string, any> }) => void }) {
  const [data, setData] = useState<SalaryData[] | null>(null);

  // Load data
  useEffect(() => {
    d3.csv<SalaryData>(parameters.data, (d) => ({
      userID: +d['User ID'], // Convert to number
      salary: +d['Salary Value'], // Convert to number
    })).then((_data) => {
      setData(_data);
      // Set the answer to reflect the data load
      setAnswer({ status: true, answers: { salaryData: _data } });
    });
  }, [parameters, setAnswer]);

  useEffect(() => {
    if (data) {
      const width = 800;
      const height = 400;
      const radius = Math.min(width, height) / 2;
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      d3.select('#pie-chart').select('svg').remove();

      const svg = d3.select('#pie-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const pie = d3.pie<SalaryData>()
        .value((d) => d.salary);

      const arc = d3.arc<any>()
        .outerRadius(radius)
        .innerRadius(0);

      const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');

      arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i.toString()));

      arcs.append('text')
        .attr('transform', (d) => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .text((d) => `ID ${d.data.userID}`);
    }
  }, [data]);

  return data ? (
    <div id="pie-chart" style={{ height: 400, width: 800 }}>
      {}
    </div>
  ) : <Loader />;
}

export default PieChart;
