"use client";

import { useState } from 'react';

export default function Home() {
  const [queryResult, setQueryResult] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [annotation, setAnnotation] = useState('');

  const handleQuery = async () => {
    setQueryResult('');
    setAnnotation('');
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: userQuery }),
    });
    const data = await res.json();
    setQueryResult(data.query);
    setChatResult(data.data);
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
      body: JSON.stringify({user: userQuery, system: queryResult + (annotation? `/* Annotation: ${annotation} */` : '') }),
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

  return (
    <div style={{ padding: '20px' }}>
      <div>
        <input
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          type="text"
          placeholder="Enter your input"
          style={{ marginRight: '10px', padding: '5px' }} />
        <button onClick={handleQuery} style={{ marginRight: '10px' }}>Query</button>
        <button onClick={handleChat}>Chat</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <textarea
          value={queryResult}
          readOnly
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
          style={{ marginRight: '10px', padding: '5px' }} />
      </div>

      <div>
        <button onClick={handleSaveQuery} style={{ marginRight: '10px' }}>Save Query</button>
        <button onClick={handleSaveData}>Save Data</button>
      </div>
    </div>
  );
}
