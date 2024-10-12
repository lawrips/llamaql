import { executeNLQuery, translateQueryResult } from './queryUtils';

// Function to reset all query-related state variables
export const resetQueryState = (setDbQuery, setDbResult, setTranslatedResult, setUserChat) => {
    setDbQuery('');
    setDbResult([]);
    setTranslatedResult('');
    setUserChat('');
};

// Function to process query instructions based on checked items
export const getInstructions = (queryInstructions, instructSubs, checkedItems) => {
    let _instructions = queryInstructions;
    instructSubs.forEach((item) => {
        if (!checkedItems.has(item)) {
            _instructions = _instructions.replace("{" + item + "}", "");
        }
    });
    return _instructions;
};

// Function to execute multiple queries in parallel
export const executeQueries = async (queries, selectedModel, appName, instructions, dataSchema, dataExplanation, requery, handleDataChunk) => {
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
                if (parsedData.status === 'query-executed') {
                    result = JSON.parse(parsedData.content);
                }
                handleDataChunk(parsedData);
            }
        );
        return result;
    }));
};

// Function to handle the results of multiple queries
export const handleMultipleQueries = async (results, addedQueries, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult) => {
    const dbQueries = results.map(r => r.query);
    const dbResults = results.map(r => r.data);
    setDbQuery(dbQueries);
    setDbResult(dbResults);

    await translateQueryResult(
        selectedModel,
        appName,
        addedQueries.map(q => q.query),
        addedQueries.map(q => q.annotation),
        dbResults,
        dataInstructions,
        chunk => setTranslatedResult(prev => prev + chunk)
    );
};

// Function to handle different types of data chunks received during query execution
export const handleDataChunk = (parsedData, accumulatedContent, setDbQuery) => {
    if (parsedData.status === 'in-progress') {
        return handleInProgressChunk(parsedData.content, accumulatedContent, setDbQuery);
    } else if (parsedData.status === 'query-executed') {
        return handleQueryExecutedChunk(parsedData.content, setDbQuery);
    } else if (parsedData.status === 'error') {
        return handleErrorChunk(parsedData.error);
    }
};

// Helper function to handle 'in-progress' data chunks
const handleInProgressChunk = (content, accumulatedContent, setDbQuery) => {
    accumulatedContent += content;
    const sqlContent = extractSqlContent(accumulatedContent);
    if (sqlContent) {
        setDbQuery(sqlContent);
    }
    return accumulatedContent;
};

// Helper function to extract SQL content from a string
const extractSqlContent = (content) => {
    const startMarker = '```sql';
    const endMarker = '```';
    const startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
        const sqlContentStart = startIndex + startMarker.length;
        const endIndex = content.indexOf(endMarker, sqlContentStart);
        return endIndex !== -1 
            ? content.substring(sqlContentStart, endIndex).trim()
            : content.substring(sqlContentStart).trim();
    }
    return null;
};

// Helper function to handle 'query-executed' data chunks
const handleQueryExecutedChunk = (content, setDbQuery) => {
    const queryData = JSON.parse(content);
    if (!queryData.error) {
        setDbQuery(queryData.query);
        return queryData;
    } else {
        throw new Error(queryData.error);
    }
};

// Helper function to handle error data chunks
const handleErrorChunk = (error) => {
    console.error('Error during query:', error);
    throw new Error(error);
};

// Function to handle and display query errors
export const handleQueryError = (error, setTranslatedResult) => {
    console.error('Error during query:', error);
    setTranslatedResult(error.toString());
};

// Function to handle the translation of query results
export const handleTranslation = async (result, userQuery, annotation, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult) => {
    try {
        if (result) {
            setDbQuery(result.query);
            setDbResult(result.data);
            console.log('setting and sending dbresult:', result);
        }

        await translateQueryResult(
            selectedModel,
            appName,
            userQuery,
            annotation,
            result ? result.data : null,
            dataInstructions,
            chunk => setTranslatedResult(prev => prev + chunk)
        );
        console.log("Translation completed.");
    } catch (error) {
        console.error("Error during translation:", error);
        throw error;
    }
};
