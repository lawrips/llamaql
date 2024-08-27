"use client";

import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';


export default function Home() {
  const [dataQuery, setDataQuery] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [queries, setQueries] = useState([]);
  const [queryOptions, setQueryOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false); // State for loading
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [models, setModels] = useState([]);


  const _models = [
    { value: "gpt-4o-mini", label: "gpt-4o-mini (default)" },
    { value: "gpt-4o", label: "gpt-4o (higher quality)" },
  ];

  // Fetch initial options for the dropdown on page load
  useEffect(() => {
    const fetchInitialOptions = async () => {
      const res = await fetch('/api/load-queries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      let _queries = {};
      data.forEach(i => {
        _queries[i.messages[0].content] = i.messages[1].content;
      });
      setQueries(_queries);
      setQueryOptions(data.map(i => i.messages[0].content) || []);
      console.log(data)

      const finetunes = await fetch('/api/finetune', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const finetuneData = await finetunes.json();
      console.log(finetuneData)
      setModels(_models.concat(finetuneData.map(i => { return { label: `${i.name} (${i.status})`, value: i.name } })));




    };

    fetchInitialOptions();
  }, []);




  const handleQuery = async () => {
    setLoading(true); // Start spinner
    //setDataQuery('');
    setChatResult('');

    try {
      const res = await fetch(`/api/query?model=${selectedModel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userQuery }),
      });
      const data = await res.json();
      console.log(res)
      if (res.status == 400) {
        setDataQuery(data.query)
        setChatResult(data.error);

      }
      else {
        setDataQuery('');
        setTimeout(() => {
          setDataQuery(data.query);
        }, 200)

        const res2 = await fetch(`/api/translate?model=${selectedModel}`, {
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

  const handleDirectQuery = async () => {
    setLoading(true); // Start spinner
    //setDataQuery('');
    setChatResult('');

    try {
      const res = await fetch(`/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: dataQuery }),
      });
      const data = await res.json();
      console.log(res)
      if (res.status == 400) {
        setDataQuery(data.query)
        setChatResult(data.error);

      }
      else {
        setDataQuery('');
        setTimeout(() => {
          setDataQuery(data.query);
        }, 200)

        const res2 = await fetch(`/api/translate?model=${selectedModel}`, {
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
    const res = await fetch('/api/chat', {
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
    await fetch('/api/save-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: userQuery }, { role: 'assistant', content: dataQuery + (annotation ? ` /* Annotation: ${annotation} */` : '') }] }),
    });
    alert('Query result saved!');
  };

  const handleSaveData = async () => {
    await fetch('/api/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatResult }),
    });
    alert('Chat result saved!');
  };

  const handleExportJsonl = async () => {
    await fetch('/api/export-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    alert('Export done!');
  };

  const handleFinetune = async () => {
    await fetch('/api/finetune', {
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

    }
  };

  const handleModelSelect = (event) => {
    setSelectedModel(event.target.value);
    console.log(event.target.value)
  };


  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <div>
        <div style={{ position: 'relative' }} className="autocomplete-container">
          <h1 style={{ color: "white" }}>QGEN (@lawrips, v0.1)</h1>
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



        <button onClick={handleQuery} style={{ marginTop: '5px', marginRight: '10px' }}>Query</button>
        <select id="models" name="models" value={selectedModel} onChange={handleModelSelect}>
          {models.map((model, index) => (
            <option key={index} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '20px' }}>

        <Tabs>
          <TabList>
            <Tab>DB Query</Tab>
            <Tab>DB Schema</Tab>
            <Tab>Instructions</Tab>
          </TabList>
          <TabPanel>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-end' }}>
              <textarea
                value={dataQuery}
                placeholder="DB Query"
                onChange={(e) => setDataQuery(e.target.value)}
                rows={10}
                style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px' }}
              />&nbsp;
              <button onClick={handleDirectQuery} style={{ marginRight: '10px', marginBottom: '10px' }}>&gt;</button>
            </div>
          </TabPanel>
          <TabPanel>
            blah
          </TabPanel>
          <TabPanel>
            blah
          </TabPanel>
          </Tabs>

          <textarea
            value={chatResult}
            readOnly
            rows={10}
            placeholder="Natural Language Result"
            style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px' }}
          />
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
        {/*<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>*/}
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
