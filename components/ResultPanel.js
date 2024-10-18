import React, { useRef, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCheck, Check, Flag, SquareCheck, SquareSlash, Square, CircleCheckBig, CircleAlert } from 'lucide-react';

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

const ResultPanel = ({ translatedResult, chartData, chartTicks, chartKeys, handleChartClicked, queryEvaluation, queryEvaluationReason }) => {
  const markdownRef = useRef(null);
  const [chartType, setChartType] = useState('BarChart');
  const [isMarkdownFocused, setIsMarkdownFocused] = useState(false);
  const [visibleTooltip, setVisibleTooltip] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMarkdownFocused && (e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        
        const selection = window.getSelection();
        const range = document.createRange();
        
        range.selectNodeContents(markdownRef.current);
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMarkdownFocused]);

  const ChartComponent = {
    BarChart: BarChart,
    LineChart: LineChart,
    AreaChart: AreaChart,
    RadarChart: RadarChart,
  }[chartType];

  const chartSpecificProps = chartType === 'AreaChart' || chartType === 'StackedAreaChart'
    ? { stackOffset: "expand" }
    : {};

  const getConfidenceIcon = () => {
    let icon;
    switch (queryEvaluation) {
      case 'exact_match':
        icon = <CircleCheckBig size={24} color="green" />;
        break;
      case 'similar_derivative':
        icon = <CircleCheckBig size={24} color="gray" />;
        break;
      case 'new_class':
        icon = <CircleAlert size={24} color="gray" />;
        break;
      default:
        icon = null;
    }

    return (
      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setVisibleTooltip(true)}
        onMouseLeave={() => setVisibleTooltip(false)}
      >
        {icon}
        {visibleTooltip && (
          <div className="tooltip">
            {queryEvaluationReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Tabs>
        <div className="flex items-center">
          <TabList className="flex-grow">
            <Tab><span style={{ display: 'flex', alignItems: 'center' }}>Results {queryEvaluation ? <span style={{ marginLeft: '5px' }}>{getConfidenceIcon()}</span> : null}</span></Tab>
            <Tab>Chart</Tab>
          </TabList>
        </div>
        <TabPanel>
          <div 
            ref={markdownRef} 
            className="markdown-wrapper" 
            tabIndex="0"
            onFocus={() => setIsMarkdownFocused(true)}
            onBlur={() => setIsMarkdownFocused(false)}
          >
            <Markdown className="markdown-content" remarkPlugins={[remarkGfm]}>
              {translatedResult}
            </Markdown>
          </div>
        </TabPanel>
        <TabPanel>
          <div>
            <div className="flex w-1/4 gap-4 p-4" style={{ minHeight: '50px' }}>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="BarChart">Bar Chart</option>
                <option value="LineChart">Line Chart</option>
                <option value="AreaChart">Area Chart</option>
                <option value="StackedAreaChart">Stacked Area Chart</option>
                <option value="RadarChart">Radar Chart</option>
              </select>
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
                  <YAxis
                    allowDataOverflow={true}
                    yAxisId="left"
                    ticks={chartTicks.ticks || []}
                    domain={[chartTicks.niceMin, chartTicks.niceMax]} />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      position: 'relative',
                    }} />

                  {chartKeys.map((key, index) => {
                    const color = colors[index % colors.length];
                    const yAxisId = "left";
                    switch (chartType) {
                      case 'BarChart':
                        return <Bar yAxisId={yAxisId} key={key} dataKey={key} fill={color} />;
                      case 'LineChart':
                        return <Line yAxisId={yAxisId} key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} />;
                      case 'AreaChart':
                      case 'StackedAreaChart':
                        return <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={color} />;
                      default:
                        return null;
                    }
                  })}
                </ChartComponent>
              ) : (
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
