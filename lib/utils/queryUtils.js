import { handleStreamingResponse } from './queryHelpers';

export const fetchInitialOptions = async (appName) => {
  const res = await fetch(`/api/protected/app/${appName}/load-setup`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
};

export const executeNLQuery = async (model, appName, query, annotation, instructions, dataSchema, dataExplanation, generate, onDataChunk) => {
  const res = await fetch(`/api/protected/app/${appName}/query?model=${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: query,
      annotation: annotation,
      instructions: instructions,
      schema: `${dataSchema}\n${dataExplanation}`,
      generate: generate,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    onDataChunk({ status: 'error', error: errorText });
    return;
  }

  let result;
  await handleStreamingResponse(res, (parsedData) => {
    if (parsedData.status === 'query-executed') {
      console.log('Received data in executeNLQuery from query-executed:', parsedData);
      result = JSON.parse(parsedData.content);
    }
    onDataChunk(parsedData);
  });

  return result;
};

export const executeDirectQuery = async (model, appName, query) => {
  const res = await fetch(`/api/protected/app/${appName}/execute?model=${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: query }),
  });
  return await res.json();
};

export const translateQueryResult = async (model, appName, query, annotation, input, instructions, onDataChunk) => {
  const response = await fetch(`/api/protected/app/${appName}/translate?model=${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, annotation, input, instructions })
  });

  if (!response.ok) {
    throw new Error('Failed to initiate translation');
  }

  await handleStreamingResponse(response, onDataChunk);
};

export const translateChartResult = async (model, appName, input) => {
  const res = await fetch(`/api/protected/app/${appName}/translate?model=${model}&type=chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (res.status == 200) {
    return await res.json();
  }
  else if (res.status == 413) {
    throw new Error('Request was too large. Try limiting your query to just "the top 10" entries, trying a group or further refining (e.g. by date, name, etc)')
  }
  throw new Error(res.statusText)
};

export const executeChat = async (model, appName, chatData, onDataChunk) => {

  const res = await fetch(`/api/protected/app/${appName}/chat?model=${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    onDataChunk({ status: 'error', error: errorText });
    return;
  }

  let result;
  await handleStreamingResponse(res,onDataChunk);
  

  return result;
};
