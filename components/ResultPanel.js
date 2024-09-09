import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResultPanel = ({ chatResult, chartData }) => {
  const ticks = React.useMemo(() => {
    if (chartData.length === 0) return [];
    const yValues = chartData.map(d => d.yVal);
    const min = Math.min(...yValues) * 0.95;
    const max = Math.max(...yValues) * 1.05;
    return Array.from({ length: 10 }, (_, i) => min + (max - min) * i / 9);
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
              <YAxis
                domain={[ticks[0], ticks[ticks.length - 1]]}
                ticks={ticks}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip />
              <Bar type="monotone" dataKey="yVal" stroke="#8884d8" activeDot={{ r: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ResultPanel;