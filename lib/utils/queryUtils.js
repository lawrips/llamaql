export const fetchInitialOptions = async (appName) => {
    const res = await fetch(`/api/load-setup?app=${appName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  };

  export const executeNLQuery = async(model, appName, query, annotation, instructions, dataSchema, requery) => {
    const res = await fetch(`/api/query?model=${model}&app=${appName}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ input: query, annotation: annotation, instructions: instructions, schema: dataSchema, requery: requery }),
    }); 
    return await res.json();
  };
  
  export const executeDirectQuery = async (model, appName, query) => {
    const res = await fetch(`/api/execute?model=${model}&app=${appName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query }),
    });
    return await res.json();
  };
  
  export const translateQueryResult = async (model, appName, query, annotation, input, instructions) => {
    const res = await fetch(`/api/translate?model=${model}&app=${appName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${query} (${annotation})`, input, instructions }),
    });
    if (res.status == 200) {
      return await res.json();
    }
    throw new Error(res.statusText)
  };