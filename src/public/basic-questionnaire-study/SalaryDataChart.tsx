/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';

// Define the type for salary data
interface SalaryData {
  userID: number;
  salary: number;
}

export function BrushPlot({ parameters, setAnswer }: { parameters: { data: string }, setAnswer: ({ status, provenanceGraph, answers }: { status: boolean, provenanceGraph?: any, answers: Record<string, any> }) => void }) {
  const [data, setData] = useState<SalaryData[] | null>(null);

  // Load data
  useEffect(() => {
    d3.csv<SalaryData>(parameters.data, (d) => ({
      userID: +d['User ID'],
      salary: +d['Salary Value'],
    })).then((_data) => {
      setData(_data);
      // Set the answer to reflect the data load
      setAnswer({ status: true, answers: { salaryData: _data } });
    });
  }, [parameters, setAnswer]);

  useEffect(() => {
    if (data) {
      const margin = {
        top: 20, right: 30, bottom: 40, left: 40,
      };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      d3.select('#bar-chart').select('svg').remove();

      const svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleBand()
        .domain(data.map((d) => d.userID.toString()))
        .range([0, width])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.salary)!])
        .range([height, 0]);

      svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => xScale(d.userID.toString())!)
        .attr('y', (d) => yScale(d.salary))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => height - yScale(d.salary))
        .attr('fill', 'steelblue');

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat((d) => `ID ${d}`))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-40)');

      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(10).tickFormat((d) => `$${d.toLocaleString()}`));
    }
  }, [data]);

  return data ? (
    <div id="bar-chart" style={{ height: 400, width: 800 }}>
      {}
    </div>
  ) : <Loader />;
}

export default BrushPlot;
