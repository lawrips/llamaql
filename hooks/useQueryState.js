import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchInitialOptions, executeDirectQuery, translateChartResult } from '../lib/utils/queryUtils';
import { useRouter } from 'next/navigation';
import { generateNiceTicks } from '../lib/utils/graphUtils';
import { 
    resetQueryState, 
    getInstructions, 
    executeQueries, 
    handleMultipleQueries, 
    handleDataChunk, 
    handleQueryError,
    handleTranslation
} from '../lib/utils/queryHelpers';

export const useQueryState = (appName) => {
    const [userQuery, setUserQuery] = useState('');
    const [userChat, setUserChat] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [dbQuery, setDbQuery] = useState('');
    const [dbResult, setDbResult] = useState([]);
    const [translatedResult, setTranslatedResult] = useState('');
    const [chartData, setChartData] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [loading, setLoading] = useState(false);
    const [queryOptions, setQueryOptions] = useState([]);
    const [models, setModels] = useState([]);
    const [queryInstructions, setQueryInstructions] = useState('');
    const [requeryInstructions, setRequeryInstructions] = useState('');
    const [dataInstructions, setDataInstructions] = useState('');
    const [dataSchema, setDataSchema] = useState('');
    const [dataExplanation, setDataExplanation] = useState('');
    const [dataExamples, setDataExamples] = useState('');
    const [instructSubs, setInstructSubs] = useState([]);
    const [checkedItems, setCheckedItems] = useState(new Set());
    const [showDropdown, setShowDropdown] = useState('');
    const [queries, setQueries] = useState({});
    const [focusedInput, setFocusedInput] = useState(null);
    const [chartTicks, setChartTicks] = useState({ ticks: [], niceMin: 0, niceMax: 0 });
    const [chartKeys, setChartKeys] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [shared, setShared] = useState(false);
    const [createTableCount, setCreateTableCount] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);  // State to control modal visibility
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);  // State to control modal visibility
    const fileInputRef = useRef(null);
    const [checkedOptions, setCheckedOptions] = useState({});
    const [addedQueries, setAddedQueries] = useState([]);
    const [queryButtonText, setQueryButtonText] = useState('Query');
    const [addedQueriesData, setAddedQueriesData] = useState([]);
    const dbQueryTextAreaRef = useRef(null);
    const router = useRouter();


    useEffect(() => {
        const fetchInitialData = async () => {
            const data = await fetchInitialOptions(appName);
            if (!data) {
                router.push('/');
                return null;
            }
            setQueries(data.queries);
            setShared(data.shared);

            // update query dropdown
            setQueryOptions(data.queries.map(i => i.userQuery));

            // set the schema panel
            //setDataSchema(data.dataSchema[0].examples + data.dataSchema[1].schema);
            //setDataSchema(data.dataSchema[0].examples + data.dataSchema[1].schema);
            setDataSchema(JSON.stringify(data.dataSchema, null, 2));
            setDataExamples(data.dataSchema.map(i => i.examples));
            setDataExplanation(data.dataSchema[data.dataSchema.length - 1].schema);

            // update the instructions panel
            if (data.instructions) {
                const _instructions = JSON.parse(data.instructions);

                setQueryInstructions(_instructions.queryInstructions);
                setRequeryInstructions(_instructions.requeryInstructions);
                setDataInstructions(_instructions.dataInstructions);
                const substitutions = [...new Set(_instructions.queryInstructions.match(/{([^}]+)}/g).map(match => match.slice(1, -1)))];
                setInstructSubs(substitutions);
                setCheckedItems(new Set(substitutions));
            }
            // uncomment these lines below when you want finetunes back in the picture
            //const finetunes = await fetch(`/api/protected/app/${appName}/finetune`).then(res => res.json());
            setModels([
                { value: "gpt-4o-mini", label: "gpt-4o-mini (default - fast & efficient)" },
                { value: "gpt-4o-2024-08-06", label: "gpt-4o (slower & exp - use for building hard queries)" },
                //...finetunes.map(i => ({ label: `${i.name} (${i.status})`, value: i.name }))
            ]);
        };


        fetchInitialData();
    }, [appName]);

    useEffect(() => {
        if (dbQueryTextAreaRef.current) {
            dbQueryTextAreaRef.current.scrollTop = dbQueryTextAreaRef.current.scrollHeight;
        }
    }, [dbQuery]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Trigger the button click event
            handleQuery();
        }
    };

    const handleCheckboxChange = (option) => {
        setCheckedOptions((prevState) => ({
            ...prevState,
            [option]: !prevState[option], // Toggle the checkbox state
        }));
    };


    const handleAddQuery = () => {
        if (userQuery.trim() !== '') {
            setAddedQueries([...addedQueries, { query: userQuery.trim(), annotation: annotation.trim() }]);
            setUserQuery('');
            setQueryButtonText('Multi-Query');
            console.log('addedQueries:', addedQueries)
        }
    };

    const handleRemoveQuery = (index) => {
        const newQueries = addedQueries.filter((_, i) => i !== index);
        setAddedQueries(newQueries);
        if (newQueries.length == 0) {
            setQueryButtonText('Query');
        }
    };
    let accumulatedContent = '';


    const handleQuery = async (requery) => {
        if (userQuery || addedQueries.length > 0) {
            setLoading(true);
            resetQueryState(setDbQuery, setDbResult, setTranslatedResult, setUserChat);

            try {
                const _instructions = getInstructions(queryInstructions, instructSubs, checkedItems);
                const queries = addedQueries.length > 0 ? addedQueries : [{ query: userQuery, annotation }];

                let accumulatedContent = '';
                const results = await executeQueries(
                    queries, 
                    selectedModel, 
                    appName, 
                    _instructions, 
                    dataSchema, 
                    dataExplanation, 
                    requery, 
                    (parsedData) => {
                        accumulatedContent = handleDataChunk(parsedData, accumulatedContent, setDbQuery);
                    }
                );

                console.log('results:', results);
                
                if (results && results.length > 0) {
                    if (addedQueries.length > 0) {
                        await handleMultipleQueries(results, addedQueries, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult);
                    } else {
                        await handleTranslation(results[0], userQuery, annotation, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult);
                    }
                } else {
                    throw new Error('No results returned from query execution');
                }
            } catch (error) {
                handleQueryError(error, setTranslatedResult);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDirectQuery = async () => {
        setLoading(true);
        resetQueryState(setDbQuery, setDbResult, setTranslatedResult, setUserChat);

        try {
            const queryData = await executeDirectQuery(selectedModel, appName, dbQuery);
            
            if (!queryData.error) {
                await handleTranslation(queryData, userQuery, annotation, selectedModel, appName, dataInstructions, setDbQuery, setDbResult, setTranslatedResult);
            } else {
                throw new Error(queryData.error);
            }
        } catch (error) {
            handleQueryError(error, setTranslatedResult);
            setDbQuery(dbQuery);
            setDbResult([]);
        } finally {
            setLoading(false);
        }
    };

    // Function to be called when an option is selected from the dropdown
    const handleOptionSelect = (event, option) => {
        event.preventDefault(); // Prevent onBlur from firing immediately
        console.log('Option selected:', option);
        setUserQuery(option);
        setShowDropdown(false);

        let matchedQuery = queries.filter(i => i.userQuery == option)[0];
        console.log(queries)
        console.log(matchedQuery)
        if (matchedQuery) {
            setTranslatedResult('')
            setAnnotation(matchedQuery.userAnnotation || '');
            setDbQuery(matchedQuery.dbQuery);
            //setFocusedInput(null);

            if (matchedQuery.dbResult) {
                setTranslatedResult(matchedQuery.dbResult);
                makeChart(matchedQuery.dbResult);
            }
        }
    };

    const handleDeleteOption = async (event, option) => {
        console.log('Option selected:', option);

        let remainingQueries = queries.filter(i => i.userQuery != option);
        let remainingQueryOptions = queryOptions.filter(i => i != option);
        setQueries(remainingQueries);
        setQueryOptions(remainingQueryOptions);

        await fetch(`/api/protected/app/${appName}/save-query`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery: option }),
        });
        // show confirmation dialog
        setDialogOpen(true);
    }

    const handleDialogClose = () => {
        setDialogOpen(false); // Close the modal
    };

    const handleDialogCancel = () => {
        setDialogOpen(false); // Close the modal
    };


    const makeChart = (data) => {
        const extractCode = (text) => {
            const regex = /```(?:javascript|json|js)\s*([\s\S]*?)\s*```/;
            const match = text.match(regex);
            return match ? match[1].trim() : null;
        };
        let _chartData = JSON.parse(extractCode(data));
        if (_chartData) {

            if (_chartData.length === 0) {
                setChartTicks({ ticks: [], niceMin: 0, niceMax: 0 });
                return;
            }

            // yAxis presentation
            try {
                // Step 1: Identify all Y-series keys dynamically (exclude 'xVal')
                const yKeys = Object.keys(_chartData[0]).filter(key => key !== 'xVal');

                // Step 2: Aggregate all Y-values from all Y-series
                const yValues = _chartData.flatMap(dataPoint =>
                    yKeys
                        .map(key => Number(dataPoint[key]))
                        .filter(value => !isNaN(value))
                );

                // Handle case where there are no valid Y-values
                if (yValues.length === 0) return { ticks: [], niceMin: 0, niceMax: 0 };

                // Step 3: Compute min and max with scaling factors
                const minVal = Math.min(...yValues) * 0.95;
                const maxVal = Math.max(...yValues) * 1.05;

                // Step 4: Generate "nice" ticks
                let { ticks, niceMin, niceMax } = generateNiceTicks(minVal, maxVal, 10);
                setChartTicks({ ticks, niceMin, niceMax });
                setChartKeys(yKeys);
            } catch (ex) {
                console.log('error doing nicetick calculation')
                console.log(ex);
            }

            setChartData(_chartData);
        }
    };

    const handleInstructSubChange = (item) => {
        setCheckedItems((prevCheckedItems) => {
            const newCheckedItems = new Set(prevCheckedItems);
            if (newCheckedItems.has(item)) {
                newCheckedItems.delete(item);
            } else {
                newCheckedItems.add(item);
            }
            return newCheckedItems;
        });
    };

    const handleSaveQuery = async () => {
        await fetch(`/api/protected/app/${appName}/save-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery: userQuery, userAnnotation: annotation, dbQuery: dbQuery, dbResult: translatedResult }),
        });
        // show confirmation dialog
        setDialogOpen(true);

        // reload just the queries
        const data = await fetchInitialOptions(appName);
        setQueries(data.queries);
        setQueryOptions(data.queries.map(i => i.userQuery));
    };

    const handleSaveInstructions = async () => {
        await fetch(`/api/protected/app/${appName}/instructions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataInstructions, queryInstructions, requeryInstructions, dataExplanation }),
        });
        // show confirmation dialog
        setDialogOpen(true);
    };

    const handleChartClicked = async () => {
        if (!chartData) {
            setLoading(true);
            console.log(dbResult);
            const translatedData = await translateChartResult(selectedModel, appName, dbResult);
            setChartData(translatedData.data);
            makeChart(translatedData.data);
            setLoading(false);
        }
    };

    const handleChatReturn = (e) => {
        if (e.key === 'Enter') {
            // Trigger the button click event
            handleChat();
        }
    };

    const handleChat = async () => {
        console.log('dbQuery', dbQuery);
        console.log('dbResult', dbResult);
        console.log('userChat', userChat);

        if (dbResult) {
            try {
                let _userChat = userChat;
                setUserChat('');
                setLoading(true);
                setTranslatedResult(''); // Reset the translated result before starting a new chat
                let _translatedResult = '';
                // Step 1: Initiate chat job with a POST request
                console.log(addedQueries)
                const res = await fetch(`/api/protected/app/${appName}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userQuery: addedQueries.length > 0 ? JSON.stringify(addedQueries) : `${userQuery} (${annotation})`,
                        schema: `${dataSchema}\n${dataExplanation}`,
                        dbQuery: dbQuery,
                        dbResult: addedQueries.length > 0 ? addedQueriesData.map(i => i.data) : dbResult,
                        userChat: _userChat,
                        chatResult: translatedResult
                    }),
                });

                if (!res.ok) {
                    throw new Error('Failed to initiate chat');
                }

                // Parse the response to get the jobId
                const { jobId } = await res.json();

                // Step 2: Set up SSE to listen for the chat result
                const eventSource = new EventSource(`/api/protected/app/${appName}/chat?jobId=${jobId}`);

                // Function to handle incoming data chunks
                const handleDataChunk = (chunk) => {
                    //console.log('Streaming status:', chunk);
                    _translatedResult += chunk;
                    setTranslatedResult((prevResult) => prevResult + chunk);
                };

                // Event listener for receiving messages
                eventSource.onmessage = (event) => {
                    try {
                        const parsedData = JSON.parse(event.data);

                        if (parsedData.status === 'completed') {
                            console.log('Chat completed.');
                            eventSource.close();
                            console.log('_userChat:', _userChat)
                            if (_userChat == '/chart') {
                                console.log('making chart:', _translatedResult)
                                setChartData(_translatedResult);
                                makeChart(_translatedResult);
                            }
                        } else if (parsedData.status === 'failed') {
                            console.error('Chat failed:', parsedData.error);
                            setTranslatedResult(`Error: ${parsedData.error}`);
                            eventSource.close();
                        } else if (parsedData.chunk) {
                            // Handle each streaming chunk of data
                            handleDataChunk(parsedData.chunk);
                        }
                    } catch (error) {
                        console.error('Error parsing streaming data:', error);
                    }
                };

                // Event listener for errors
                eventSource.onerror = (error) => {
                    setLoading(false);
                    console.error('EventSource error:', error);
                    eventSource.close();
                    setTranslatedResult('An error occurred during the streaming process.');
                };
            } catch (ex) {
                console.error('Error during chat request:', ex);
                setTranslatedResult(`Error: ${ex.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSaveData = async () => {
        await fetch(`/api/protected/app/${appName}/save-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userQuery, data: translatedResult }),
        });
        // show confirmation dialog
        setDialogOpen(true);
    };

    const handleExportJsonl = async () => {
        console.log(appName)
        let response = await fetch(`/api/protected/app/${appName}/export-json`, { method: 'POST' });
        const blob = await response.blob(); // Convert response to a Blob
        const url = window.URL.createObjectURL(blob); // Create URL for the Blob

        // Create a temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${appName}_export.jsonl`; // Specify the filename for download
        document.body.appendChild(link);
        link.click(); // Programmatically click the link to trigger the download
        link.remove(); // Remove the link after triggering the download

        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
    };

    const handleImportJsonl = () => {
        fileInputRef.current.click();  // Trigger the file input click
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Access the uploaded file

        if (file) {
            const reader = new FileReader();

            // Define the callback to execute when the file is read
            reader.onload = async (e) => {
                const fileContents = e.target.result;
                const json = fileContents.trim().split('\n').map(line => JSON.parse(line));

                for (const item of json) {
                    let _userMessage = item.messages.filter(i => i.role == 'user');

                    console.log(item)
                    await fetch(`/api/protected/app/${appName}/save-query`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userQuery: _userMessage[0].content.trim(), userAnnotation: _userMessage[1].content.replace('[Annotation]: ', '').trim(),
                            dbQuery: item.messages.filter(i => i.role == 'assistant')[0].content, dbResult: null
                        }),
                    });
                }

                // reload just the queries
                const data = await fetchInitialOptions(appName);
                setQueries(data.queries);
                setQueryOptions(data.queries.map(i => i.userQuery));

                // show confirmation dialog
                setDialogOpen(true);
            };

            // Read the file as text
            reader.readAsText(file);
        }
    };

    const handleFinetune = async () => {
        await fetch(`/api/protected/app/${appName}/finetune?app`, { method: 'POST' });
        // show confirmation dialog
        setDialogOpen(true);
    };

    const handleOpenCreateDialog = async () => {
        if (dbQuery) {
            setLoading(true);
            try {
                const queryData = await executeDirectQuery(selectedModel, appName, dbQuery);
                console.log(queryData)
                if (!queryData.error) {
                    setDbQuery(queryData.query);
                    console.log("count: " + queryData.data?.length);
                    setCreateTableCount(queryData.data?.length);
                    setIsCreateModalOpen(true);
                }
                else {
                    console.error('Error during direct query:', queryData.error);
                    setTranslatedResult(queryData.error);
                }
            } catch (error) {
                console.error('Exception during direct query:', error);

                setTranslatedResult(error);
            } finally {
                setLoading(false);
            }
        }

    };

    const handleOpenDeleteDialog = async () => {
        setIsDeleteModalOpen(true);
    };

    // Function that handles the creation of a table
    const handleCreateTable = async (tableName) => {
        setIsCreateModalOpen(false);  // Close the modal after creation
        setLoading(true);

        await fetch(`/api/protected/app/${appName}/table`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName: tableName, dbQuery: dbQuery }),
        });

        // show confirmation dialog
        setLoading(false);
        setDialogOpen(true);
    };

    // Function that handles the creation of a table
    const handleDeleteTable = async (tableName) => {
        setIsDeleteModalOpen(false);  // Close the modal after creation
        setLoading(true);

        await fetch(`/api/protected/app/${appName}/table`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName: tableName }),
        });

        // show confirmation dialog
        setLoading(false);
        setDialogOpen(true);
    };

    // Function that handles the cancel action
    const handleCancelTable = () => {
        setIsCreateModalOpen(false);  // Close the modal when "Cancel" is clicked
        setIsDeleteModalOpen(false);  // Close the modal when "Cancel" is clicked
    };


    const getInputStyle = (inputType) => {
        const baseStyle = {
            transition: 'all 300ms ease-in-out',
            width: focusedInput === null ? '50%' : (focusedInput === inputType ? '75%' : '25%'),
            minWidth: 0, // This allows the input to shrink below its content size
        };
        return baseStyle;
    };


    return {
        userQuery,
        setUserQuery,
        userChat,
        setUserChat,
        annotation,
        setAnnotation,
        dbQuery,
        setDbQuery,
        translatedResult,
        chartData,
        chartTicks,
        chartKeys,
        selectedModel,
        setSelectedModel,
        loading,
        queryOptions,
        models,
        queryInstructions,
        setQueryInstructions,
        requeryInstructions,
        setRequeryInstructions,
        dataInstructions,
        setDataInstructions,
        dataSchema,
        setDataSchema,
        instructSubs,
        checkedItems,
        handleQuery,
        handleDirectQuery,
        handleInstructSubChange,
        handleSaveQuery,
        handleSaveData,
        handleCreateTable,
        handleDeleteTable,
        handleCancelTable,
        handleExportJsonl,
        handleImportJsonl,
        handleFileChange,
        fileInputRef,
        handleFinetune,
        showDropdown,
        setShowDropdown,
        handleOptionSelect,
        handleDeleteOption,
        focusedInput,
        setFocusedInput,
        getInputStyle,
        handleKeyDown,
        dialogOpen,
        handleDialogClose,
        handleSaveInstructions,
        handleChat,
        handleChatReturn,
        shared,
        dataExamples,
        setDataExamples,
        dataExplanation,
        setDataExplanation,
        isCreateModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleOpenCreateDialog,
        handleOpenDeleteDialog,
        createTableCount,
        handleChartClicked,
        handleCheckboxChange,
        checkedOptions,
        handleAddQuery,
        handleRemoveQuery,
        addedQueries,
        queryButtonText,
        dbQueryTextAreaRef
    };
};