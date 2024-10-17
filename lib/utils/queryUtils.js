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
    result = onDataChunk(parsedData);
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
  console.log("response", response)

  if (response.status == 413) {
    throw new Error('Max char length exceeded. Try limiting your query to just "the top 10" entries, trying a group or further refining (e.g. by date, name, etc)');
  }
  if (!response.ok) {
    throw new Error('Failed to initiate translation');
  }

  let result;
  await handleStreamingResponse(response, (parsedData) => {
    result = onDataChunk(parsedData);
  });

  return result;
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
  await handleStreamingResponse(res, (parsedData) => {
    result = onDataChunk(parsedData);
  });

  return result;
};
