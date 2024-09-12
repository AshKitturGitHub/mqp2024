import { Loader, Button } from '@mantine/core';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';

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
    });
  }, [parameters]);

  useEffect(() => {
    if (data) {
      // ... (rest of the D3 chart creation code remains the same)
    }
  }, [data]);

  const handleSubmit = () => {
    if (data) {
      setAnswer({ status: true, answers: { salaryData: data } });
    }
  };

  return data ? (
    <div>
      <div id="bar-chart" style={{ height: 400, width: 800 }}>
        {}
      </div>
      <Button onClick={handleSubmit}>Submit Data</Button>
    </div>
  ) : <Loader />;
}

export default BrushPlot;
