import { useState, useEffect } from 'react';
import { fetchInitialOptions, executeDirectQuery, executeNLQuery, translateQueryResult } from '../lib/utils/queryUtils';

export const useQueryState = (appName) => {
    const [userQuery, setUserQuery] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [dbQuery, setDbQuery] = useState('');
    const [chatResult, setChatResult] = useState('');
    const [chartData, setChartData] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [loading, setLoading] = useState(false);
    const [queryOptions, setQueryOptions] = useState([]);
    const [models, setModels] = useState([]);
    const [queryInstructions, setQueryInstructions] = useState('');
    const [requeryInstructions, setRequeryInstructions] = useState('');
    const [dataInstructions, setDataInstructions] = useState('');
    const [dataSchema, setDataSchema] = useState('');
    const [instructSubs, setInstructSubs] = useState([]);
    const [checkedItems, setCheckedItems] = useState(new Set());
    const [showDropdown, setShowDropdown] = useState('');
    const [queries, setQueries] = useState({});
    const [focusedInput, setFocusedInput] = useState(null);


    useEffect(() => {
        const fetchInitialData = async () => {
            const data = await fetchInitialOptions(appName); 
            console.log(data)     
            setQueries(data.queries);

            setQueryOptions(data.queries.map(i => i.userQuery));
            setDataSchema(JSON.stringify(data.dataSchema, null, 2));
            if (data.instructions) {
                const _instructions = JSON.parse(data.instructions);

                setQueryInstructions(_instructions.queryInstructions);
                setRequeryInstructions(_instructions.requeryInstructions);
                setDataInstructions(_instructions.dataInstructions);
                const substitutions = [...new Set(_instructions.queryInstructions.match(/{([^}]+)}/g).map(match => match.slice(1, -1)))];
                setInstructSubs(substitutions);
                setCheckedItems(new Set(substitutions));
            }
            const finetunes = await fetch(`/api/finetune?app=${appName}`).then(res => res.json());
            setModels([
                { value: "gpt-4o-mini", label: "gpt-4o-mini (default)" },
                { value: "gpt-4o", label: "gpt-4o (higher quality)" },
                ...finetunes.map(i => ({ label: `${i.name} (${i.status})`, value: i.name }))
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
            setChatResult('');
            try {
                let _instructions = requery ? requeryInstructions : queryInstructions;
                instructSubs.forEach((item) => {
                    if (!checkedItems.has(item)) {
                        _instructions = _instructions.replace("{" + item + "}", "")
                    }
                });
                const queryData = await executeNLQuery(selectedModel, appName, userQuery, annotation, _instructions, dataSchema, requery ? dbQuery : null);
                console.log(queryData)
                setDbQuery(queryData.query);
                const translatedData = await translateQueryResult(selectedModel, appName, userQuery, annotation, queryData.data, dataInstructions);
                setChatResult(translatedData.data);
                makeChart(translatedData.data);
            } catch (error) {
                console.error('Error during query:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDirectQuery = async () => {
        setLoading(true);
        setChatResult('');
        try {
            const queryData = await executeDirectQuery(selectedModel, appName, dbQuery);
            setDbQuery(queryData.query);
            const translatedData = await translateQueryResult(selectedModel, appName, userQuery, annotation, queryData.data, dataInstructions);
            setChatResult(translatedData.data);
            makeChart(translatedData.data);
        } catch (error) {
            console.error('Error during direct query:', error);
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
            setChatResult('')
            setAnnotation(matchedQuery.userAnnotation);
            setDbQuery(matchedQuery.dbQuery);
            //setFocusedInput(null);
            
            if (matchedQuery.dbResult) {
                setChatResult(matchedQuery.dbResult);
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

        await fetch(`/api/save-query?app=${appName}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery: option}),
        });
        alert('Query deleted!');
    }


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
        await fetch(`/api/save-query?app=${appName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery: userQuery, userAnnotation: annotation, dbQuery: dbQuery, dbResult: chatResult }),
        });
        alert('Query result saved!');

        // reload just the queries
        const data = await fetchInitialOptions(appName);      
        setQueries(data.queries);
        setQueryOptions(data.queries.map(i => i.userQuery));

    };

    const handleSaveData = async () => {
        await fetch(`/api/save-data?app=${appName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userQuery, data: chatResult }),
        });
        alert('Chat result saved!');
    };

    const handleExportJsonl = async () => {
        await fetch(`/api/export-json?app=${appName}`, { method: 'POST' });
        alert('Export done!');
    };

    const handleFinetune = async () => {
        await fetch(`/api/finetune?app=${appName}`, { method: 'POST' });
        alert('Finetuning started!');
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
        annotation,
        setAnnotation,
        dbQuery,
        setDbQuery,
        chatResult,
        chartData,
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
        handleExportJsonl,
        handleFinetune,
        showDropdown,
        setShowDropdown,
        handleOptionSelect,
        handleDeleteOption,
        setFocusedInput,
        getInputStyle,
        handleKeyDown
    };
};