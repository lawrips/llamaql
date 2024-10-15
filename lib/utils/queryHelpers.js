import { executeNLQuery, translateQueryResult } from './queryUtils';

// Function to reset all query-related state variables
export const resetQueryState = (setDbQuery, setDbResult, setTranslatedResult, setUserChat) => {
    // Reset all state variables to their initial empty values
    if (setDbQuery) setDbQuery('');
    if (setDbResult) setDbResult([]);
    if (setTranslatedResult) setTranslatedResult('');
    if (setUserChat) setUserChat('');
};

// Function to process query instructions based on checked items
export const getInstructions = (queryInstructions, instructSubs, checkedItems) => {
    let _instructions = queryInstructions;
    // Iterate through each instruction substitution
    instructSubs.forEach((item) => {
        if (!checkedItems.has(item)) {
            // Remove placeholders for unchecked items to customize instructions
            _instructions = _instructions.replace("{" + item + "}", "");
        }
        // Placeholders for checked items are left intact for later substitution
    });
    return _instructions;
};

// Function to execute multiple queries in parallel
export const executeQueries = async (queries, selectedModel, appName, instructions, dataSchema, dataExplanation, requery, handleDataChunk) => {
    // Execute all queries concurrently for better performance
    return Promise.all(queries.map(async query => {
        let result;
        await executeNLQuery(
            selectedModel,
            appName,
            query.query,
            query.annotation,
            instructions,
            dataSchema,
            dataExplanation,
            requery ? true : null,
            (parsedData) => {
                // Store the final query result when execution is complete
                if (parsedData.status === 'query-executed') {
                    console.log('in executeQueries, hit query-executed result:', parsedData.content);
                    result = JSON.parse(parsedData.content);
                }
                // Pass parsed data to handler for real-time UI updates
                handleDataChunk(parsedData);
            }
        );
        return result;
    }));
};


// Create a closure to maintain state across multiple calls
export const createDataChunkHandler = (setDbQuery) => {
    let accumulatedContent = '';

    return (parsedData) => {
        if (typeof setDbQuery !== 'function') {
            console.error('setDbQuery is not a function:', setDbQuery);
            return;
        }

        if (parsedData.status === 'in-progress') {
            accumulatedContent = handleInProgressChunk(parsedData.content, accumulatedContent, setDbQuery);
        } else if (parsedData.status === 'query-executed') {
            handleQueryExecutedChunk(parsedData.content, setDbQuery);
        } else if (parsedData.status === 'error') {
            handleErrorChunk(parsedData.error);
        }
    };
};

// Helper function to handle 'in-progress' data chunks
const handleInProgressChunk = (content, accumulatedContent, setDbQuery) => {
    accumulatedContent += content;
    //console.log('accumulatedContent:', accumulatedContent);
    const sqlContent = extractSqlContent(accumulatedContent);
    if (sqlContent && typeof setDbQuery === 'function') {
        setDbQuery(sqlContent);
    } else if (typeof setDbQuery === 'function') {
        setDbQuery(accumulatedContent);
    }
    return accumulatedContent;
};

// Helper function to extract SQL content from a string
const extractSqlContent = (content) => {
    const startMarker = '```sql';
    const endMarker = '```';
    // Find the start of the SQL block
    const startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
        const sqlContentStart = startIndex + startMarker.length;
        // Find the end of the SQL block
        const endIndex = content.indexOf(endMarker, sqlContentStart);
        // Extract SQL content, handling cases where the end marker might be missing
        return endIndex !== -1
            ? content.substring(sqlContentStart, endIndex).trim()
            : content.substring(sqlContentStart).trim();
    }
    return null; // Return null if no SQL content is found
};

// Helper function to handle 'query-executed' data chunks
const handleQueryExecutedChunk = (content, setDbQuery) => {
    try {
        //console.log('Query executed content:', content);
        const queryData = JSON.parse(content);
        if (!queryData.error) {
            if (setDbQuery) setDbQuery(queryData.query);
            return queryData;
        } else {
            throw new Error(queryData.error);
        }
    } catch (error) {
        console.error('Error parsing query executed chunk:', error);
        throw error;
    }
};

// Helper function to handle error data chunks
const handleErrorChunk = (error) => {
    console.error('Error during query:', error);
    throw new Error(error); // Re-throw error for upstream handling
};

// Function to handle and display query errors
export const handleQueryError = (error, setTranslatedResult) => {
    console.error('Error during query:', error);
    // Display error message in the translated result area for user feedback
    setTranslatedResult(error.toString());
};

// Function to handle the translation of query results
export const handleTranslation = async (result, dbQuery, userQuery, annotation, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult) => {
    try {
        if (result) {
            // Update state with query and result data
            //setDbQuery(userQuery);
            setDbResult(result);
            console.log('setting and sending dbresult:', result);
        }

        // Translate the query result, updating UI in real-time with chunks
        await translateQueryResult(
            selectedModel,
            appName,
            userQuery,
            annotation,
            result,
            dataInstructions,
            chunk => {
                //console.log('chunk:', chunk.content);
                setTranslatedResult(prev => prev + chunk.content) // Accumulate chunks for smooth UI updates
            }
        );
        console.log("Translation completed.");
    } catch (error) {
        console.error("Error during translation:", error);
        throw error; // Re-throw for upstream error handling
    }
};

export const handleStreamingResponse = async (response, onDataChunk) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let done = false;
    let partialChunk = '';

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
            const chunkValue = decoder.decode(value);
            //console.log('Received chunk:', chunkValue); // Log every chunk

            partialChunk += chunkValue;

            let lines = partialChunk.split('\n');

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
                            //console.log('data:', data);
                            const parsedData = JSON.parse(data);
                            //console.log('Parsed data:', parsedData); // Log parsed data
                            onDataChunk(parsedData);
                        } catch (e) {
                            console.error('Error parsing data chunk:', e);
                        }
                    }
                }
            }
        }
    }
};
