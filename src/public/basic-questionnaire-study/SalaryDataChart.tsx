import React, { useEffect, useState, useRef } from 'react';
import { Loader, Button } from '@mantine/core';
import * as d3 from 'd3';

interface SalaryData {
  userID: number;
  salary: number;
}

interface BarChartProps {
  parameters: { data: string };
  setAnswer: (arg: { status: boolean; provenanceGraph?: any; answers: Record<string, any> }) => void;
}

export function BarChart({ parameters, setAnswer }: BarChartProps) {
  const [data, setData] = useState<SalaryData[] | null>(null);
  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    d3.csv<SalaryData>(parameters.data, (d) => ({
      userID: +d['User ID'],
      salary: +d['Salary Value'],
    })).then((_data) => {
      setData(_data);
    });
  }, [parameters.data]);

  useEffect(() => {
    if (data && chartRef.current) {
      d3.select(chartRef.current).selectAll("*").remove();

      const margin = { top: 30, right: 30, bottom: 70, left: 60 };
      const width = 460 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3.select(chartRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.userID.toString()))
        .padding(0.2);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.salary) || 0])
        .range([height, 0]);

      svg.append("g")
        .call(d3.axisLeft(y));

      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.userID.toString()) || 0)
        .attr("y", d => y(d.salary))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.salary))
        .attr("fill", "#69b3a2");
    }
  }, [data]);

  const handleSubmit = () => {
    if (data) {
      setAnswer({ status: true, answers: { salaryData: data } });
    }
  };

  return (
    <div>
      {data ? (
        <>
          <svg ref={chartRef} style={{ height: 400, width: 460 }}></svg>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
}

export default BarChart;
