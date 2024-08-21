"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [queryResult, setQueryResult] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [queries, setQueries] = useState([]);
  const [queryOptions, setQueryOptions] = useState([]);
  const [loading, setLoading] = useState(false); // State for loading

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
    };

    fetchInitialOptions();
  }, []);

  const handleQuery = async () => {
    setLoading(true); // Start spinner
    //setQueryResult('');
    setChatResult('');

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userQuery }),
      });
      const data = await res.json();
      setQueryResult('');
      setTimeout(() => {
        setQueryResult(data.query);
      }, 200)

      const res2 = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: data.data }),
      });
      const data2 = await res2.json();

      setChatResult(data2.data);
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
      body: JSON.stringify({ messages: [{ role: 'user', content: userQuery }, { role: 'assistant', content: queryResult + (annotation ? ` /* Annotation: ${annotation} */` : '') }] }),
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

  // Function to be called when an option is selected from the dropdown
  const handleOptionSelect = (event) => {
    console.log('Option selected:', event.target.value);
    let matchedQuery = queries[event.target.value];
    if (matchedQuery) {
      setChatResult('')
      const annotation = (matchedQuery.match(/\/\* Annotation:\s*(.*?)\s*\*\//s) || ["", ""])[1].trim();
      const query = matchedQuery.replace(/\/\* Annotation:\s*.*?\s*\*\//s, '').trim();
      setAnnotation(annotation);
      setQueryResult(query);
    }
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <div>
        <input
          list="query-options"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onInput={handleOptionSelect}
          type="text"
          placeholder="Enter your input"
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <datalist id="query-options">
          {queryOptions.map((option, index) => (
            <option key={index} value={option} />
          ))}
        </datalist>
        <button onClick={handleQuery} style={{ marginRight: '10px' }}>Query</button>
        <button onClick={handleChat}>Chat</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <textarea
          value={queryResult}
          onChange={(e) => setQueryResult(e.target.value)}
          rows={10}
          style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px' }}
        />
        <textarea
          value={chatResult}
          readOnly
          rows={10}
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
        <button onClick={handleSaveQuery} style={{ marginRight: '10px' }}>Save Query</button>
        <button onClick={handleSaveData}>Save Data</button>
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
