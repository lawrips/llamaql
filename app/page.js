"use client";

import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { PureComponent } from 'react';
import { BarChart, Bar, Rectangle, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search } from 'lucide-react';



export default function Home() {
  const [dbQuery, setDbQuery] = useState('');
  const [dataSchema, setDataSchema] = useState('');
  const [queryInstructions, setQueryInstructions] = useState('');
  const [dataInstructions, setDataInstructions] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [chartData, setChartData] = useState([]);
  const [yMinMax, setYMinMax] = useState([]);
  const [ticks, setTicks] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [queries, setQueries] = useState({});
  const [results, setResults] = useState({});
  const [annotations, setAnnotations] = useState({});
  const [queryOptions, setQueryOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false); // State for loading
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [models, setModels] = useState([]);
  const [instructSubs, setInstructSubs] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const searchParams = useSearchParams();
  const appName = searchParams.get('app');
  const [isOpen, setIsOpen] = useState(true);

  const toggleContent = () => {
    setIsOpen(!isOpen);
  };

  const numTicks = 10;

  const data = [
    {
      xVal: 'A',
      yVal: 4000,
    },
    {
      xVal: 'B',
      yVal: 3000,
    }
  ];



  const _models = [
    { value: "gpt-4o-mini", label: "gpt-4o-mini (default)" },
    { value: "gpt-4o", label: "gpt-4o (higher quality)" },
  ];

  // Fetch initial options for the dropdown on page load
  useEffect(() => {

    const fetchInitialOptions = async () => {
      const res = await fetch(`/api/load-setup?app=${appName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      let _queries = {};
      let _results = {};
      let _annotations = {};
      console.log(data.queries)
      data.queries.forEach(i => {
        _queries[i.userQuery] = i.dbQuery;
        _results[i.userQuery] = i.dbResult;
        _annotations[i.userQuery] = i.userAnnotation;
      });

      setQueries(_queries);
      setResults(_results);
      setAnnotations(_annotations);
      setQueryOptions(data.queries.map(i => i.userQuery));
      setDataSchema(JSON.stringify(data.dataSchema, null, 2));
      console.log(data)
      if (data.instructions[0]) {
        let _instructions = data.instructions[0][0]
        setQueryInstructions(_instructions);

        setDataInstructions(data.instructions[1][0]);

        // extract all ${variables} from the instructions
        let substitutions = [...new Set(_instructions.match(/{([^}]+)}/g).map(match => match.slice(1, -1)))];
        setInstructSubs(substitutions);
        let _checked = new Set();
        substitutions.forEach((i) => {
          _checked.add(i);
        });
        setCheckedItems(_checked)
      }

      const finetunes = await fetch(`/api/finetune?app=${appName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const finetuneData = await finetunes.json();
      setModels(_models.concat(finetuneData.map(i => { return { label: `${i.name} (${i.status})`, value: i.name } })));

    };

    fetchInitialOptions();
  }, []);




  const handleQuery = async () => {
    //setChartData(data)

    if (userQuery) {

      setLoading(true); // Start spinner
      //setDbQuery('');
      setChatResult('');


      try {
        // remove items from instructions if requested
        let _instructions = queryInstructions;
        instructSubs.forEach((item) => {
          if (!checkedItems.has(item)) {
            _instructions = _instructions.replace("{" + item + "}", "")
          }
        })
        console.log(_instructions)

        const res = await fetch(`/api/query?model=${selectedModel}&app=${appName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: `${userQuery} (${annotation})`, instructions: _instructions, schema: dataSchema }),
        });
        const data = await res.json();
        console.log('***')
        console.log(data)
        if (res.status == 400) {
          setDbQuery(data.query)
          setChatResult(data.error);

        }
        else {
          setDbQuery('');
          setTimeout(() => {
            setDbQuery(data.query);
          }, 200)

          const res2 = await fetch(`/api/translate?model=${selectedModel}&app=${appName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: `${userQuery} (${annotation})`, input: data.data, instructions: dataInstructions }),
          });
          const data2 = await res2.json();

          setChatResult(data2.data);

          makeChart(data2.data);


        }

      } catch (error) {
        console.error('Error during query:', error);
      } finally {
        setLoading(false); // Stop spinner
      }
    }
  };

  const makeChart = (data) => {
    let extractCode = function (text) {
      const regex = /```(?:javascript|json|js)\s*([\s\S]*?)\s*```/;
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    }
    let _chartData = extractCode(data);
    console.log(_chartData)
    _chartData = JSON.parse(_chartData)
    console.log('chart data')
    console.log(_chartData)
    setChartData(_chartData)
    console.log(_chartData)

    const _yMinMax = [
      Math.min(..._chartData.map(d => d.yVal * 0.95)), // find the minimum y-value
      Math.max(..._chartData.map(d => d.yVal * 1.05)), // find the maximum y-value
    ];

    setYMinMax(_yMinMax);
    const _ticks = getNiceTicks(_yMinMax[0], _yMinMax[1], numTicks);
    console.log(_ticks)
    setTicks(_ticks);

  };

  const handleDirectQuery = async () => {
    setLoading(true); // Start spinner
    //setDbQuery('');
    setChatResult('');

    try {
      const res = await fetch(`/api/execute?model=${selectedModel}&app=${appName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: dbQuery }),
      });
      const data = await res.json();
      console.log(data)

      if (res.status == 400) {
        setDbQuery(data.query)
        setChatResult(data.error);
      }
      else {
        setDbQuery('');
        setTimeout(() => {
          setDbQuery(data.query);
        }, 200)

        const res2 = await fetch(`/api/translate?model=${selectedModel}&app=${appName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: `${userQuery} (${annotation})`, input: data.data, instructions: dataInstructions}),
        });
        const data2 = await res2.json();

        setChatResult(data2.data);
        makeChart(data2.data);
      }

    } catch (error) {
      console.error('Error during query:', error);
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  const handleChat = async () => {
    const res = await fetch(`/api/chat?app=${appName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: userQuery }),
    });
    const data = await res.json();
    setChatResult(data.result);
  };

  const handleSaveQuery = async () => {
    await fetch(`/api/save-query?app=${appName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      //body: JSON.stringify({ messages: [{ role: 'user', content: userQuery + (annotation ? ` /* Annotation: ${annotation} */` : '') }, { role: 'assistant', content: dbQuery }] }),
        body: JSON.stringify({ userQuery: userQuery, userAnnotation: annotation, dbQuery: dbQuery, dbResult: chatResult }),
    });
    alert('Query result saved!');
  };

  const handleSaveData = async () => {
    await fetch(`/api/save-data?app=${appName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: userQuery, data: chatResult }),
    });
    alert('Chat result saved!');
  };

  const handleExportJsonl = async () => {
    await fetch(`/api/export-json?app=${appName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    alert('Export done!');
  };

  const handleFinetune = async () => {
    await fetch(`/api/finetune?app=${appName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    alert('Finetuning  started!');
  };

  // Function to be called when an option is selected from the dropdown
  const handleOptionSelect = (event, option) => {
    event.preventDefault(); // Prevent onBlur from firing immediately
    console.log('Option selected:', option);
    setUserQuery(option);
    setShowDropdown(false);

    let matchedQuery = queries[option];
    if (matchedQuery) {
      setChatResult('')
      const annotation = annotations[option];
      const query = matchedQuery;
      setAnnotation(annotation);
      setDbQuery(query);

      if (results[option]) {
        setChatResult(results[option]);
        makeChart(results[option]);
      }

    }
  };

  const handleModelSelect = (event) => {
    setSelectedModel(event.target.value);
    console.log(event.target.value)
  };

  const handleInstructSubChange = (item) => {
    setCheckedItems((prevCheckedItems) => {
      const newCheckedItems = new Set(prevCheckedItems);
      if (newCheckedItems.has(item)) {
        newCheckedItems.delete(item);
      } else {
        newCheckedItems.add(item);
      }
      return newCheckedItems;
    });
  };


  const getNiceTicks = (min, max, numTicks) => {
    const range = max - min;
    const rawTickInterval = range / (numTicks - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawTickInterval)));
    const niceTickInterval = Math.ceil(rawTickInterval / magnitude) * magnitude;

    const niceMin = Math.floor(min / niceTickInterval) * niceTickInterval;
    const niceMax = Math.ceil(max / niceTickInterval) * niceTickInterval;

    const ticks = [];
    for (let tick = niceMin; tick <= niceMax; tick += niceTickInterval) {
      ticks.push(tick);
    }

    return ticks;
  };

  return (
    <div style={{ padding: '10px' }}>
     <div className="grid-container">
      <div className="col-span-2">
        <h3 className="text-xl font-bold mb-2">QGEN (v0.1)</h3>
      </div>
      
      <div className="autocomplete-container">
        <div className="relative">
          <input
            className="autocomplete-input"
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowDropdown(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowDropdown(false), 200);
            }}
            type="text"
            placeholder="Natural Language Query"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        {showDropdown && (
          <div className="autocomplete-dropdown">
            {queryOptions
              .filter(option => option.toLowerCase().includes(userQuery.toLowerCase()))
              .map((option, index) => (
                <div
                  className="autocomplete-option"
                  key={index}
                  onMouseDown={(e) => handleOptionSelect(e, option)}>
                  {option}
                </div>
              ))}
          </div>            
        )}
      </div>
      
      <div>
        <input
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          type="text"
          placeholder="Annotation (Optional)"
        />
      </div>
      
      <div>
        <select
          id="models"
          name="models"
          value={selectedModel}
          onChange={handleModelSelect}
        >
          <option value="">Select a model</option>
          {models.map((model, index) => (
            <option key={index} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="col-span-1">
        <button onClick={handleQuery}>
          Query
        </button>
      </div>
    </div>


      <div style={{ marginTop: '20px' }}>
        <Tabs>
          <div className="tab-container">

            <TabList>
              <Tab>Data Query</Tab>
              <Tab>Query Instructions</Tab>
              <Tab>Data Instructions</Tab>
              <Tab>Data Schema</Tab>
            </TabList>
            <div className="collapsible" onClick={toggleContent}>
              {isOpen ? '⮝' : '⮟'}
            </div>
          </div>

          {isOpen && (

            <div className="content">
              <TabPanel>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-end' }}>
                  <textarea
                    value={dbQuery}
                    placeholder="Data Query"
                    onChange={(e) => setDbQuery(e.target.value)}
                    rows={10}
                    style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap'  }}
                  />&nbsp;&nbsp;
                  <button onClick={handleDirectQuery} style={{ marginRight: '10px', marginBottom: '10px' }}>&gt;</button>
                </div>
              </TabPanel>
              <TabPanel>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <textarea
                    value={queryInstructions}
                    placeholder="Query Instructions"
                    onChange={(e) => setQueryInstructions(e.target.value)}
                    rows={10}
                    style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                  />&nbsp;
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    Enable / disable sending of variables in the instructions:<br /><br />
                    {instructSubs.map((item) => (
                      <div key={item}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checkedItems.has(item)}
                            onChange={() => handleInstructSubChange(item)}
                          />&nbsp;
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <textarea
                    value={dataInstructions}
                    placeholder="Data Instructions"
                    onChange={(e) => setDataInstructions(e.target.value)}
                    rows={10}
                    style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                  />&nbsp;
                </div>
              </TabPanel>
              <TabPanel>
                <textarea
                  value={dataSchema}
                  placeholder="Data Schema"
                  onChange={(e) => setDataSchema(e.target.value)}
                  rows={10}
                  style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                />&nbsp;
              </TabPanel>
            </div>
          )}
        </Tabs>
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

      <div>
        <button onClick={handleSaveQuery} style={{ marginRight: '10px', marginTop: '10px' }}>Save Query</button>
        {<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>}
        {<button onClick={handleExportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Export training set (JSONL)</button>}
        {<button onClick={handleFinetune} style={{ marginRight: '10px', marginTop: '10px' }}>Begin Finetune</button>}
      </div>

      {/* Overlay spinner */}
      {loading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
