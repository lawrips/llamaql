import { executeNLQuery, translateQueryResult } from './queryUtils';

// Function to reset all query-related state variables
export const resetQueryState = (setDisplayedQuery, setDbQuery, setUnparsedQuery, setDbResult, setTranslatedResult, setUserChat, setQueryEvaluation, setQueryEvaluationReason, setExpectedResults) => {
    // Reset all state variables to their initial empty values
    if (setDisplayedQuery) setDisplayedQuery('');
    if (setDbQuery) setDbQuery('');
    if (setUnparsedQuery) setUnparsedQuery('');
    if (setDbResult) setDbResult([]);
    if (setTranslatedResult) setTranslatedResult('');
    if (setUserChat) setUserChat('');
    if (setQueryEvaluation) setQueryEvaluation('');
    if (setQueryEvaluationReason) setQueryEvaluationReason('');
    if (setExpectedResults) setExpectedResults('');
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


// Create a closure to maintain state across multiple calls
// setData will typically be setDisplayedQuery or setTranslatedResult
export const createDataChunkHandler = (setData) => {
    let accumulatedContent = '';
    let result;

    return (parsedData) => {
        if (parsedData.status === 'in-progress') {
            accumulatedContent = handleInProgressChunk(parsedData.content, accumulatedContent, setData);
            return accumulatedContent;
        } else if (parsedData.status === 'query-executed') {
            result = handleQueryExecutedChunk(parsedData.content, setData);
            return result;
        } else if (parsedData.status === 'completed') {            
            return result || accumulatedContent;
        } else if (parsedData.status === 'error') {
            handleErrorChunk(parsedData.content);
        }
    };
};

// Helper function to handle 'in-progress' data chunks
const handleInProgressChunk = (content, accumulatedContent, setData) => {
    accumulatedContent += content;
    //console.log('accumulatedContent:', accumulatedContent);
    const sqlContent = extractSqlContent(accumulatedContent);
    //const sqlContent = accumulatedContent.replaceAll("\\n", "\n");
    //console.log('sqlContent:', sqlContent);
    if (sqlContent && typeof setData === 'function') {
        setData(sqlContent);
    } else if (typeof setData === 'function') {
        setData(accumulatedContent);
    }
    return accumulatedContent;
};

// Helper function to extract SQL content from a potentially incomplete JSON string
const extractSqlContent = (content) => {
    const queryKey = '"query": "';
    const queryStart = content.indexOf(queryKey);
    if (queryStart === -1) {
        // "query": " not found in the content
        return null;
    }

    const startIndex = queryStart + queryKey.length;
    // Look for the closing quote of the query
    let endIndex = content.indexOf('"', startIndex);

    if (endIndex === -1) {
        // Closing quote not found, return the partial query
        const partialQuery = content.substring(startIndex).replace(/\\"/g, '"');
        return unescapeEscapedCharacters(partialQuery);
    } else {
        // Complete query found
        const completeQuery = content.substring(startIndex, endIndex).replace(/\\"/g, '"');
        return unescapeEscapedCharacters(completeQuery);
    }
};

// Helper function to unescape escaped characters like \n, \t, etc.
const unescapeEscapedCharacters = (str) => {
    return str.replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
};

// Helper function to handle 'query-executed' data chunks
const handleQueryExecutedChunk = (content, setData) => {
    try {
        console.log('Query executed content:', content);
        const queryData = JSON.parse(content);
        if (setData) setData(queryData.query);

        if (!queryData.error) {
            return queryData;
        } else {
            console.log('error:', queryData.error);
            throw new Error(queryData.error);
        }
    } catch (error) {
        console.error('Error parsing query executed chunk:', error.toString());
        throw error;
    }
};

// Helper function to handle error data chunks
const handleErrorChunk = (content) => {
    content = JSON.parse(content);
    console.error('Error during query (chunk):', content.error);
    //return {error: content.error, query: content.query};
    throw new Error(content.error); // Re-throw error for upstream handling
};

// Function to handle and display query errors
export const handleQueryError = (error, setTranslatedResult) => {
    console.error('Error during query:', error);
    // Display error message in the translated result area for user feedback
    setTranslatedResult(error.toString());
};

// Function to handle the translation of query results
export const handleTranslation = async (result, userQuery, annotation, selectedModel, appName, dataInstructions, setDbResult, setTranslatedResult) => {
    try {
        if (result) {
            // Update state with query and result data
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
                        //try {
                            //console.log('data:', data);
                            const parsedData = JSON.parse(data);
                            //console.log('Parsed data:', parsedData); // Log parsed data
                            onDataChunk(parsedData);
                        //} catch (e) {
                            //console.error('Error parsing data chunk:', e);
                        //}
                    }
                }
            }
        }
    }
};
