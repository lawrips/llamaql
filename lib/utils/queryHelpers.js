import { executeNLQuery, translateQueryResult } from './queryUtils';

// Function to reset all query-related state variables
export const resetQueryState = (setDbQuery, setDbResult, setTranslatedResult, setUserChat) => {
    // Reset all state variables to their initial empty values
    setDbQuery('');
    setDbResult([]);
    setTranslatedResult('');
    setUserChat('');
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
                    result = JSON.parse(parsedData.content);
                }
                // Pass parsed data to handler for real-time UI updates
                handleDataChunk(parsedData);
            }
        );
        return result;
    }));
};

// Function to handle the results of multiple queries
export const handleMultipleQueries = async (results, addedQueries, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult) => {
    // Extract queries and data from results for state updates
    const dbQueries = results.map(r => r.query);
    const dbResults = results.map(r => r.data);
    setDbQuery(dbQueries);
    setDbResult(dbResults);

    // Translate all query results at once
    await translateQueryResult(
        selectedModel,
        appName,
        addedQueries.map(q => q.query),
        addedQueries.map(q => q.annotation),
        dbResults,
        dataInstructions,
        chunk => setTranslatedResult(prev => prev + chunk) // Accumulate translated chunks for smooth UI updates
    );
};

// Function to handle different types of data chunks received during query execution
export const handleDataChunk = (parsedData, accumulatedContent, setDbQuery) => {
    // Route chunks to appropriate handlers based on their status
    if (parsedData.status === 'in-progress') {
        return handleInProgressChunk(parsedData.content, accumulatedContent, setDbQuery);
    } else if (parsedData.status === 'query-executed') {
        return handleQueryExecutedChunk(parsedData.content, setDbQuery);
    } else if (parsedData.status === 'error') {
        return handleErrorChunk(parsedData.error);
    }
    // If status is not recognized, return unchanged accumulated content
    return accumulatedContent;
};

// Helper function to handle 'in-progress' data chunks
const handleInProgressChunk = (content, accumulatedContent, setDbQuery) => {
    // Accumulate content and attempt to extract SQL as it comes in
    accumulatedContent += content;
    const sqlContent = extractSqlContent(accumulatedContent);
    if (sqlContent) {
        // Update query state if SQL is found, providing real-time feedback
        setDbQuery(sqlContent);
    }
    // Return updated accumulated content for next chunk processing
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
    const queryData = JSON.parse(content);
    if (!queryData.error) {
        // Update query state with the final executed SQL
        setDbQuery(queryData.query);
        return queryData;
    } else {
        throw new Error(queryData.error);
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
export const handleTranslation = async (result, userQuery, annotation, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult) => {
    try {
        if (result) {
            // Update state with query and result data
            setDbQuery(result.query);
            setDbResult(result.data);
            console.log('setting and sending dbresult:', result);
        }

        // Translate the query result, updating UI in real-time with chunks
        await translateQueryResult(
            selectedModel,
            appName,
            userQuery,
            annotation,
            result ? result.data : null,
            dataInstructions,
            chunk => setTranslatedResult(prev => prev + chunk) // Accumulate chunks for smooth UI updates
        );
        console.log("Translation completed.");
    } catch (error) {
        console.error("Error during translation:", error);
        throw error; // Re-throw for upstream error handling
    }
};
