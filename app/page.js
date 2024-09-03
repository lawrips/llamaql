"use client";

import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



export default function Home() {
  const [dataQuery, setDataQuery] = useState('');
  const [dataSchema, setDataSchema] = useState('');
  const [queryInstructions, setQueryInstructions] = useState('');
  const [dataInstructions, setDataInstructions] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [chartData, setChartData] = useState([]);
  const [yMinMax, setYMinMax] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [queries, setQueries] = useState([]);
  const [results, setResults] = useState([]);
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
      data.exampleQueries.forEach(i => {
        _queries[i.messages[0].content] = i.messages[1].content;
        _results[i.messages[0].content] = i.savedData;
      });

      setQueries(_queries);
      setResults(_results);
      setQueryOptions(data.exampleQueries.map(i => i.messages[0].content) || []);
      setDataSchema(JSON.stringify(data.dataSchema, null, 2));
      let _instructions = data.instructions[0].instructions[0]
      setQueryInstructions(_instructions);

      setDataInstructions(data.instructions[0].instructions[1]);

      // extract all ${variables} from the instructions
      let substitutions = _instructions.match(/\${(.*?)}/g);
      substitutions = substitutions ? substitutions.map(match => match.slice(2, -1)) : [];
      setInstructSubs(substitutions);
      let _checked = new Set();
      substitutions.forEach((i) => {
        _checked.add(i);
      });
      setCheckedItems(_checked)

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
    //setDataQuery('');
    setChatResult('');


      try {
        // remove items from instructions if requested
        let _instructions = queryInstructions;
        instructSubs.forEach((item) => {
          if (!checkedItems.has(item)) {
            _instructions = _instructions.replace("${" + item + "}", "")
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
          setDataQuery(data.query)
          setChatResult(data.error);

        }
        else {
          setDataQuery('');
          setTimeout(() => {
            setDataQuery(data.query);
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
    const _yMinMax = [
      Math.min(..._chartData.map(d => d.y)), // find the minimum y-value
      Math.max(..._chartData.map(d => d.y)), // find the maximum y-value
    ];
    setYMinMax(_yMinMax);    
  };

  const handleDirectQuery = async () => {
    setLoading(true); // Start spinner
    //setDataQuery('');
    setChatResult('');

    try {
      const res = await fetch(`/api/execute?app=${appName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: dataQuery }),
      });
      const data = await res.json();

      if (res.status == 400) {
        setDataQuery(data.query)
        setChatResult(data.error);
      }
      else {
        setDataQuery('');
        setTimeout(() => {
          setDataQuery(data.query);
        }, 200)

        const res2 = await fetch(`/api/translate?model=${selectedModel}&app=${appName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: `${userQuery} (${annotation})`, input: data.data }),
        });
        const data2 = await res2.json();

        setChatResult(data2.data);
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
      body: JSON.stringify({ messages: [{ role: 'user', content: userQuery }, { role: 'assistant', content: dataQuery + (annotation ? ` /* Annotation: ${annotation} */` : '') }] }),
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
      const annotation = (matchedQuery.match(/\/\* Annotation:\s*(.*?)\s*\*\//s) || ["", ""])[1].trim();
      const query = matchedQuery.replace(/\/\* Annotation:\s*.*?\s*\*\//s, '').trim();
      setAnnotation(annotation);
      setDataQuery(query);

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

  return (
    <div style={{ position: 'relative', padding: '10px' }}>
      <div>
        <div style={{ position: 'relative' }} className="autocomplete-container">
          <h3 style={{ color: "white" }}>QGEN (@lawrips, v0.1)</h3>
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
              // Delay hiding dropdown to allow option selection
              setTimeout(() => setShowDropdown(false), 200);
            }}
            type="text"
            placeholder="Natural Language Query"
          />
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



        <select id="models" name="models" value={selectedModel} onChange={handleModelSelect}>
          {models.map((model, index) => (
            <option key={index} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>&nbsp;
        <button onClick={handleQuery} style={{ marginTop: '5px', marginRight: '10px' }}>Query</button>

      </div>

      <div style={{ marginTop: '20px' }}>

        <Tabs>
          <TabList>
            <Tab>Data Query</Tab>
            <Tab>Query Instructions</Tab>
            <Tab>Data Instructions</Tab>
            <Tab>Data Schema</Tab>
          </TabList>
          <TabPanel>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-end' }}>
              <textarea
                value={dataQuery}
                placeholder="Data Query"
                onChange={(e) => setDataQuery(e.target.value)}
                rows={10}
                style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px' }}
              />&nbsp;
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
        </Tabs>

        <Tabs>
          <TabList>
            <Tab>Chat</Tab>
            <Tab>Chart</Tab>
          </TabList>
          <TabPanel>
            <textarea
              value={chatResult}
              readOnly
              rows={10}
              placeholder="Natural Language Result"
              style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px' }}
            />
          </TabPanel>
          <TabPanel>
            <ResponsiveContainer className="chart" width="100%" height={400}>
              <br />
              <LineChart
                width={500}
                height={300}
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="xVal" />
                <YAxis domain={[yMinMax[0], yMinMax[1]]}/>
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yVal" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabPanel>
        </Tabs>
        <input
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          type="text"
          placeholder="Annotation (Optional)"
          style={{ marginRight: '10px', padding: '5px' }}
        />
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
