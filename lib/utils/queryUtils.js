export const fetchInitialOptions = async (appName) => {
    const res = await fetch(`/api/protected/app/${appName}/load-setup`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  };

  export const executeNLQuery = async(model, appName, query, annotation, instructions, dataSchema, requery) => {
    const res = await fetch(`/api/protected/app/${appName}/query?model=${model}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ input: query, annotation: annotation, instructions: instructions, schema: dataSchema, requery: requery }),
    }); 
    return await res.json();
  };
  
  export const executeDirectQuery = async (model, appName, query) => {
    const res = await fetch(`/api/protected/app/${appName}/execute?model=${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query }),
    });
    return await res.json();
  };
  
  export const translateQueryResult = async (model, appName, query, annotation, input, instructions) => {
    const res = await fetch(`/api/protected/app/${appName}/translate?model=${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${query} (${annotation})`, input, instructions }),
    });
    if (res.status == 200) {
      return await res.json();
    }
    else if (res.status == 413) {
      throw new Error('Request was too large. Try limiting your query to just "the top 10" entries, trying a group or further refining (e.g. by date, name, etc)')  
    }
    throw new Error(res.statusText)
  };