import React, { useState } from 'react';
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


const ResultPanel = ({ translatedResult, chartData, chartTicks, handleChatReturn, chartKeys, userChat, setUserChat }) => {
  const [chartType, setChartType] = useState('BarChart');

  let ChartComponent;
  let chartSpecificProps = {};

  switch (chartType) {
    case 'BarChart':
      ChartComponent = BarChart;
      break;
    case 'LineChart':
      ChartComponent = LineChart;
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


  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>Results</Tab>
          <Tab>Chart</Tab>
        </TabList>
        <TabPanel>
          <textarea
            value={translatedResult}
            rows={10}
            placeholder="Your Results Will Appear Here"
            style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap' }}
          />
          <div className="relative">
            <input
              className="w-full p-2 border rounded"
              value={userChat}
              autoComplete="off"
              id="customField22"
              style={{ width: '100%', boxSizing: 'border-box' }}
              onKeyDown={handleChatReturn}
              type="text"
              placeholder="Ask follow questions here"
              onChange={(e) => setUserChat(e.target.value)}
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div>
            <div className="flex w-1/4 gap-4 p-4" style={{ minHeight: '50px' }}>

              <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="BarChart">Bar Chart</option>
                <option value="LineChart">Line Chart</option>
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
                      fontSize: 14
                    }}
                  />
                  <YAxis ticks={chartTicks.ticks} domain={[chartTicks.niceMin, chartTicks.niceMax]} />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      position: 'relative', // Make sure the position is relative to apply the offset
                    }} />

                  {/* Conditionally render data components based on chart type */}
                  {chartKeys.map((key, index) => {
                    const color = colors[index % colors.length];
                    switch (chartType) {
                      case 'BarChart':
                        return <Bar key={key} dataKey={key} fill={color} />;
                      case 'LineChart':
                        return <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} />;
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
                  <PolarRadiusAxis angle={30} domain={[chartTicks.niceMin, chartTicks.niceMax]} />
                  <Tooltip />
                  <Legend />
                  {chartKeys.map((key, index) => {
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