import React, { useState, useMemo, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  RadarChart,
  Line,
  Bar,
  Area,
  Radar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const colors = [
  '#F44336', // Red
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#4CAF50', // Green
  '#00BCD4', // Cyan
  '#FFCB2B', // Yellow
  '#607D8B', // Blue Grey
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#795548', // Brown
];


const ResultPanel = ({ chatResult, chartData }) => {
  const [keys, setKeys] = useState([]);
  const [chartType, setChartType] = useState('LineChart');


  let ChartComponent;
  let chartSpecificProps = {};

  switch (chartType) {
    case 'LineChart':
      ChartComponent = LineChart;
      break;
    case 'BarChart':
      ChartComponent = BarChart;
      break;
    case 'AreaChart':
      ChartComponent = AreaChart;
      break;
    case 'StackedAreaChart':
      ChartComponent = AreaChart;
      break;
    case 'RadarChart':
      ChartComponent = RadarChart;
      break;
    default:
      ChartComponent = LineChart;
  }


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
          <div>
            <div className="flex w-1/4 gap-4 p-4" style={{ minHeight: '50px' }}>

              <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="LineChart">Line Chart</option>
                <option value="BarChart">Bar Chart</option>
                <option value="AreaChart">Area Chart</option>
                <option value="StackedAreaChart">Stacked Area Chart</option> {/* Added this line */}
                <option value="RadarChart">Radar Chart</option>
              </select>
              <br />
            </div>

            <ResponsiveContainer width="100%" height={600}>
              {chartType !== 'RadarChart' ? (
                <ChartComponent
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 100,
                  }}
                  {...chartSpecificProps}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="xVal"
                    tick={{
                      width: 20,
                      fill: '#666',
                    }}
                  />
                  <YAxis ticks={ticks} domain={[niceMin, niceMax]} />
                  <Tooltip />
                  <Legend />

                  {/* Conditionally render data components based on chart type */}
                  {keys.map((key, index) => {
                    const color = colors[index % colors.length];
                    switch (chartType) {
                      case 'LineChart':
                        return <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} />;
                      case 'BarChart':
                        return <Bar key={key} dataKey={key} fill={color} />;
                      case 'AreaChart':
                        return <Area key={key} type="monotone" dataKey={key} stroke={color} fill={color} />;
                      case 'StackedAreaChart':
                        return <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={color} />;
                      default:
                        return null;
                    }
                  })}
                </ChartComponent>
              ) : (
                // Special handling for RadarChart
                <RadarChart
                  data={chartData}
                  outerRadius={150}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="xVal" />
                  <PolarRadiusAxis angle={30} domain={[niceMin, niceMax]} />
                  <Tooltip />
                  <Legend />
                  {keys.map((key, index) => {
                    const color = colors[index % colors.length];
                    return (
                      <Radar
                        key={key}
                        name={key}
                        dataKey={key}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.6}
                      />
                    );
                  })}
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ResultPanel;