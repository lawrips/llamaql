import React, { useState, useMemo, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { LineChart, Line, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const colors = [
  '#F44336', // Red
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#4CAF50', // Green
  '#BB0000', // Deep Orange
  '#795548', // Brown
  '#3F51B5', // Indigo
  '#00BCD4', // Cyan
  '#8BC34A', // Light Green
  '#607D8B', // Blue Gray
];

const ResultPanel = ({ chatResult, chartData }) => {
  const [keys, setKeys] = useState([]);

  function generateNiceTicks(minVal, maxVal, maxTicks = 10) {
    // Handle the case where min and max are equal
    if (minVal === maxVal) {
      const ticks = Array.from({ length: 5 }, () => minVal);
      return { ticks, niceMin: minVal, niceMax: maxVal };
    }

    // Calculate the range of the data
    const range = niceNumber(maxVal - minVal, false);

    // Calculate the tick interval
    const tickSpacing = niceNumber(range / (maxTicks - 1), true);

    // Calculate nice minimum and maximum values
    const niceMin = Math.floor(minVal / tickSpacing) * tickSpacing;
    const niceMax = Math.ceil(maxVal / tickSpacing) * tickSpacing;

    // Generate tick values
    const ticks = [];
    for (let tick = niceMin; tick <= niceMax; tick += tickSpacing) {
      // Adjust decimal places based on tickSpacing
      const decimalPlaces = getDecimalPlaces(tickSpacing);
      ticks.push(parseFloat(tick.toFixed(decimalPlaces)));
    }

    return { ticks, niceMin, niceMax };
  }

  // Helper function to calculate a "nice" number for the range and tick spacing
  function niceNumber(range, round) {
    const exponent = Math.floor(Math.log10(range)); // Exponent of range
    const fraction = range / Math.pow(10, exponent); // Fractional part of range
    let niceFraction;

    if (round) {
      if (fraction < 1.5) {
        niceFraction = 1;
      } else if (fraction < 3) {
        niceFraction = 2;
      } else if (fraction < 7) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    } else {
      if (fraction <= 1) {
        niceFraction = 1;
      } else if (fraction <= 2) {
        niceFraction = 2;
      } else if (fraction <= 5) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    }

    return niceFraction * Math.pow(10, exponent);
  }

  // Helper function to determine the appropriate number of decimal places
  function getDecimalPlaces(value) {
    if (value >= 10) {
      return 0;
    } else if (value >= 1) {
      return 1;
    } else {
      const decimalPlaces = -Math.floor(Math.log10(value)) + 1;
      return decimalPlaces;
    }
  }

  const { ticks, niceMin, niceMax } = useMemo(() => {
    if (chartData.length === 0) return { ticks: [], niceMin: 0, niceMax: 0 };

    // Step 1: Identify all Y-series keys dynamically (exclude 'xVal')
    const yKeys = Object.keys(chartData[0]).filter(key => key !== 'xVal');

    // Step 2: Aggregate all Y-values from all Y-series
    const yValues = chartData.flatMap(dataPoint =>
      yKeys
        .map(key => Number(dataPoint[key]))
        .filter(value => !isNaN(value))
    );

    // Handle case where there are no valid Y-values
    if (yValues.length === 0) return { ticks: [], niceMin: 0, niceMax: 0 };

    // Step 3: Compute min and max with scaling factors
    const minVal = Math.min(...yValues) * 0.95;
    const maxVal = Math.max(...yValues) * 1.05;

    // Step 4: Generate "nice" ticks
    return generateNiceTicks(minVal, maxVal, 10);
  }, [chartData]);


  // useEffect to set the Y-series keys separately to avoid side effects in useMemo
  useEffect(() => {
    if (chartData.length > 0) {
      const yKeys = Object.keys(chartData[0]).filter(key => key !== 'xVal');
      setKeys(yKeys);
    }
  }, [chartData]);


  return (
    <div>
      <hr />
      <br />
      <Tabs>
        <TabList>
          <Tab>Chat</Tab>
          <Tab>Chart</Tab>
        </TabList>
        <TabPanel>
          <textarea
            value={chatResult}
            rows={10}
            readOnly
            placeholder="Natural Language Result"
            style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap' }}
          />
        </TabPanel>
        <TabPanel>
          <ResponsiveContainer className="chart" width="100%" height={600} marginBottom={100}>
            <br />
            <BarChart
              width={500}
              height={300}
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 100,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis interval={0} width={40} tick={{
                width: 20,
                fill: '#666',
              }} dataKey="xVal" />
              <YAxis ticks={ticks} domain={[niceMin, niceMax]} />
              <Tooltip />
              <Legend />

              {/* Dynamically generate <Bar> components based on the keys */}
              {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ResultPanel;