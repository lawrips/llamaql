import { executeNLQuery, translateQueryResult } from './queryUtils';
export const resetQueryState = (setDbQuery, setDbResult, setTranslatedResult, setUserChat) => {
    setDbQuery('');
    setDbResult([]);
    setTranslatedResult('');
    setUserChat('');
};

export const getInstructions = (queryInstructions, instructSubs, checkedItems) => {
    let _instructions = queryInstructions;
    instructSubs.forEach((item) => {
        if (!checkedItems.has(item)) {
            _instructions = _instructions.replace("{" + item + "}", "");
        }
    });
    return _instructions;
};

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

export const handleDataChunk = (parsedData, accumulatedContent, setDbQuery) => {
    if (parsedData.status === 'in-progress') {
        return handleInProgressChunk(parsedData.content, accumulatedContent, setDbQuery);
    } else if (parsedData.status === 'query-executed') {
        return handleQueryExecutedChunk(parsedData.content, setDbQuery);
    } else if (parsedData.status === 'error') {
        return handleErrorChunk(parsedData.error);
    }
};

const handleInProgressChunk = (content, accumulatedContent, setDbQuery) => {
    accumulatedContent += content;
    const sqlContent = extractSqlContent(accumulatedContent);
    if (sqlContent) {
        setDbQuery(sqlContent);
    }
    return accumulatedContent;
};

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

const handleQueryExecutedChunk = (content, setDbQuery) => {
    const queryData = JSON.parse(content);
    if (!queryData.error) {
        setDbQuery(queryData.query);
        return queryData;
    } else {
        throw new Error(queryData.error);
    }
};

const handleErrorChunk = (error) => {
    console.error('Error during query:', error);
    throw new Error(error);
};

export const handleQueryError = (error, setTranslatedResult) => {
    console.error('Error during query:', error);
    setTranslatedResult(error.toString());
};

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
