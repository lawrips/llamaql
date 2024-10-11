export const fetchInitialOptions = async (appName) => {
  const res = await fetch(`/api/protected/app/${appName}/load-setup`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
};
export const executeNLQuery = async (model, appName, query, annotation, instructions, dataSchema, dataExplanation, generate, handleDataChunk) => {
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
    handleDataChunk({ status: 'error', error: errorText });
    return;
  }


  console.log(res)
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let done = false;
  let partialChunk = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;

    if (value) {
      const chunkValue = decoder.decode(value);
      partialChunk += chunkValue;

      let lines = partialChunk.split('\n');

      // Keep the last partial line if it doesn't end with a newline
      if (!partialChunk.endsWith('\n')) {
        partialChunk = lines.pop();
      } else {
        partialChunk = '';
      }

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.replace('data:', '').trim();
          if (data !== '[DONE]') {
            try {
              const parsedData = JSON.parse(data);
              // Call the handleDataChunk callback with the parsed data
              handleDataChunk(parsedData);
            } catch (e) {
              console.error('Error parsing data chunk:', e);
            }
          }
        }
      }
    }
  }
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
  try {
    // Step 1: Initiate translation job
    const initiateResponse = await fetch(`/api/protected/app/${appName}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, annotation, input, instructions, model })
    });

    if (!initiateResponse.ok) {
      throw new Error('Failed to initiate translation');
    }

    const { jobId } = await initiateResponse.json();

    // Step 2: Set up SSE to listen for the translation result
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`/api/protected/app/${appName}/translate?jobId=${jobId}`);

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          if (parsedData.error) {
            eventSource.close();
            reject(new Error(parsedData.error));
          } else if (parsedData.status === 'completed') {
            eventSource.close();
            console.log('completed reached in queryUtils', parsedData)
            resolve();
          } else if (parsedData.chunk) {
            //parsedData.chunk = parsedData.chunk.replace('\n', '  \n');
            onDataChunk(parsedData.chunk.replaceAll('\n', '  \n'));
          }
        } catch (error) {
          console.error('Error parsing data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        reject(new Error('An error occurred during the SSE connection.'));
      };
    });
  } catch (error) {
    console.error('Error initiating translation:', error);
    throw error;
  }
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