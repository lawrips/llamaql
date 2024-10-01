import { useState, useEffect, useRef } from 'react';
import { fetchInitialOptions, executeDirectQuery, executeNLQuery, translateQueryResult } from '../lib/utils/queryUtils';
import { useRouter } from 'next/navigation';
import { generateNiceTicks } from '../lib/utils/graphUtils';

export const useQueryState = (appName) => {
    const [userQuery, setUserQuery] = useState('');
    const [userChat, setUserChat] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [dbQuery, setDbQuery] = useState('');
    const [dbResult, setDbResult] = useState('');
    const [chatResult, setChatResult] = useState('');
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
    const [chartTicks, setChartTicks] = useState({});
    const [chartKeys, setChartKeys] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [shared, setShared] = useState(false);
    const [createTableCount, setCreateTableCount] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);  // State to control modal visibility
    const fileInputRef = useRef(null);
    const router = useRouter();


    useEffect(() => {
        const fetchInitialData = async () => {
            const data = await fetchInitialOptions(appName);
            console.log("data:")
            console.log(data)
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Trigger the button click event
            handleQuery();
        }
    };

    const handleQuery = async (requery) => {
        if (userQuery) {
            setLoading(true);
            setTranslatedResult('');
            setUserChat('');
            setChatResult('');
            try {
                let _instructions = requery ? requeryInstructions : queryInstructions;
                instructSubs.forEach((item) => {
                    if (!checkedItems.has(item)) {
                        _instructions = _instructions.replace("{" + item + "}", "")
                    }
                });
                const queryData = await executeNLQuery(selectedModel, appName, userQuery, annotation, _instructions, dataSchema, dataExplanation, requery ? dbQuery : null);
                console.log('queryData:')
                console.log(queryData)
                if (!queryData.error) {
                    setDbQuery(queryData.query);
                    setDbResult(queryData.data);
                    setChatResult(queryData.chat);
                    const translatedData = await translateQueryResult(selectedModel, appName, userQuery, annotation, queryData.data, dataInstructions);
                    setTranslatedResult(translatedData.data);
                    makeChart(translatedData.data);
                }
                else {
                    console.error('Error during query:', queryData.error);
                    setDbQuery(queryData.query);
                    setChatResult(queryData.chat);
                    setDbResult(queryData.data);
                    setTranslatedResult(queryData.error);
                }
            } catch (error) {
                console.error('Error during query:', error);
                setTranslatedResult(error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDirectQuery = async () => {
        setLoading(true);
        setTranslatedResult('');
        setChatResult('');
        try {
            const queryData = await executeDirectQuery(selectedModel, appName, dbQuery);
            console.log(queryData)
            if (!queryData.error) {
                setDbQuery(queryData.query);
                const translatedData = await translateQueryResult(selectedModel, appName, userQuery, annotation, queryData.data, dataInstructions);
                setTranslatedResult(translatedData.data);
                makeChart(translatedData.data);
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
        console.log(data)
        const extractCode = (text) => {
            const regex = /```(?:javascript|json|js)\s*([\s\S]*?)\s*```/;
            const match = text.match(regex);
            return match ? match[1].trim() : null;
        };
        console.log(extractCode(data))
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

    const handleChatReturn = (e) => {
        if (e.key === 'Enter') {
            // Trigger the button click event
            handleChat();
        }
    };

    const handleChat = async () => {
        setLoading(true);
        console.log('dbQuery')
        console.log(dbQuery);
        console.log('dbResult')
        console.log(dbResult);
        console.log(userChat)
        try {

            const res = await fetch(`/api/protected/app/${appName}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userQuery: `${userQuery} (${annotation})`, schema: `${dataSchema}\n${dataExplanation}`, dbQuery: dbQuery, dbResult: dbResult, userChat: userChat, instructions: queryInstructions }),
            });
            let queryData = await res.json();

            console.log(queryData)
            setDbQuery(queryData.query);
            setDbResult(queryData.data);
            setChatResult(queryData.chat);
            const translatedData = await translateQueryResult(selectedModel, appName, userQuery, annotation, queryData.data, dataInstructions);
            setTranslatedResult(translatedData.data);
        } catch (ex) {
            console.log(ex)
        } finally {
            setLoading(false);
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

    // Function that handles the cancel action
    const handleCancelTable = () => {
        setIsCreateModalOpen(false);  // Close the modal when "Cancel" is clicked
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
        chatResult,
        setChatResult,
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
        setIsCreateModalOpen,
        handleOpenCreateDialog,
        createTableCount
    };
};