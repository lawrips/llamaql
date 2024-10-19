// app/HomeClient.js
"use client";

import { React, useState } from 'react';
import { useSession } from "next-auth/react";
import { useQueryState } from '../hooks/useQueryState';
import QueryInput from '../components/QueryInput';
import AnnotationInput from '../components/AnnotationInput';
import InstructionPanel from '../components/InstructionPanel';
import ResultPanel from '../components/ResultPanel';
import ActionButtons from '../components/ActionButtons';
import LoadingOverlay from '../components/LoadingOverlay';
import ModalDialog from '@/components/ModalDialog';
import TermsModal from '@/components/TermsModal';
import { Search, Stars, ChevronDown } from "lucide-react";


const modelOptions = [
    { header: 'Cheaper and Faster', selectable: false },
    { value: 'google/gemini-flash-1.5', display: 'Gemini 1.5 Flash', selectable: true },
    { value: 'openai/gpt-4o-mini', display: 'GPT-4o Mini', selectable: true },
    { value: 'anthropic/claude-3-haiku', display: 'Claude 3 Haiku', selectable: true },
    { header: 'More Expensive and Slower', selectable: false },
    { value: 'anthropic/claude-3.5-sonnet:beta', display: 'Claude 3.5 Sonnet', selectable: true },
    { value: 'openai/gpt-4o-2024-08-06', display: 'GPT-4o', selectable: true },
    { value: 'google/gemini-pro-1.5', display: 'Gemini 1.5 Pro', selectable: true },
];


export default function HomeClient({ appName }) {
    const {
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
        loading,
        queryOptions,
        handleOptionSelect,
        handleDeleteOption,
        handleQuery,
        handleDirectQuery,
        handleSaveQuery,
        handleChat,
        handleChatReturn,
        handleSaveData,
        handleExportJsonl,
        handleImportJsonl,
        fileInputRef,
        handleFileChange,
        handleFinetune,
        queryInstructions,
        setQueryInstructions,
        requeryInstructions,
        setRequeryInstructions,
        dataInstructions,
        setDataInstructions,
        dataSchema,
        setDataSchema,
        dataExamples,
        setDataExamples,
        dataExplanation,
        setDataExplanation,
        instructSubs,
        checkedItems,
        handleInstructSubChange,
        showDropdown,
        setShowDropdown,
        focusedInput,
        setFocusedInput,
        getInputStyle,
        handleKeyDown,
        dialogOpen,
        handleDialogClose,
        handleSaveInstructions,
        shared,
        handleCreateTable,
        handleDeleteTable,
        handleCancelTable,
        handleOpenCreateDialog,
        handleOpenDeleteDialog,
        isCreateModalOpen,
        isDeleteModalOpen,
        createTableCount,
        handleChartClicked,
        handleCheckboxChange,
        checkedOptions,
        handleAddQuery,
        handleRemoveQuery,
        addedQueries,
        queryButtonText,
        dbQueryTextAreaRef,
        handleModelSelect,
        queryEvaluation,
        queryEvaluationReason,
        handleGenerateQuery,
    } = useQueryState(appName, modelOptions);

    const [visibleTooltip, setVisibleTooltip] = useState(null);

    const tooltips = {
        0: 'Use this for simple queries or slight changes to existing queries',
        1: 'Use this for generating new or complex queries',
    };
    
    return (
        <div>
            <div className="flex w-full pb-4" >
                <QueryInput
                    userQuery={userQuery}
                    setUserQuery={setUserQuery}
                    queryOptions={queryOptions}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                    handleOptionSelect={handleOptionSelect}
                    handleDeleteOption={handleDeleteOption}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                    getInputStyle={getInputStyle}
                    handleKeyDown={handleKeyDown}
                    shared={shared}
                    handleCheckboxChange={handleCheckboxChange}
                    checkedOptions={checkedOptions}
                    handleAddQuery={handleAddQuery}
                    handleRemoveQuery={handleRemoveQuery}
                    addedQueries={addedQueries}
                    handleGenerateQuery={handleGenerateQuery}
                    setAnnotation={setAnnotation}
                />
                &nbsp;&nbsp;
                <AnnotationInput
                    annotation={annotation}
                    setAnnotation={setAnnotation}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                    getInputStyle={getInputStyle}
                    handleKeyDown={handleKeyDown}

                />
            </div>
            <div className="flex w-full pb-4 pr-4 items-center">
                <div className="flex gap-4">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button onClick={() => handleQuery(false)}
                            onMouseEnter={() => setVisibleTooltip(0)}
                            onMouseLeave={() => setVisibleTooltip(null)}
                            className="flex items-center"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            {queryButtonText} (fast)
                        </button>
                        {visibleTooltip === 0 && (
                            <div className="tooltip">
                                {tooltips[0]}
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button onClick={() => handleQuery(true)}
                            onMouseEnter={() => setVisibleTooltip(1)}
                            onMouseLeave={() => setVisibleTooltip(null)}
                            className="flex items-center"
                        >
                            <Stars className="mr-2 h-4 w-4" />
                            Deep {queryButtonText} (pro)
                        </button>
                        {visibleTooltip === 1 && (
                            <div className="tooltip">
                                {tooltips[1]}
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative mr-4 ml-4" style={{ width: '300px' }}>
                    <select
                        value={selectedModel}
                        onChange={handleModelSelect}
                        className="w-full p-2 border rounded appearance-none bg-white"
                    >
                        {modelOptions.map((option, index) => (
                            option.selectable ? (
                                <option key={index} value={option.value}>
                                    {option.display}
                                </option>
                            ) : (
                                <option key={index} disabled className="font-bold bg-gray-100">
                                    {option.header}
                                </option>
                            )
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            <InstructionPanel
                dbQuery={dbQuery}
                setDbQuery={setDbQuery}
                queryInstructions={queryInstructions}
                setQueryInstructions={setQueryInstructions}
                requeryInstructions={requeryInstructions}
                setRequeryInstructions={setRequeryInstructions}
                dataInstructions={dataInstructions}
                setDataInstructions={setDataInstructions}
                dataSchema={dataSchema}
                setDataSchema={setDataSchema}
                dataExamples={dataExamples}
                dataExplanation={dataExplanation}
                setDataExamples={setDataExamples}
                setDataExplanation={setDataExplanation}
                instructSubs={instructSubs}
                checkedItems={checkedItems}
                handleInstructSubChange={handleInstructSubChange}
                handleDirectQuery={handleDirectQuery}
                handleSaveInstructions={handleSaveInstructions}
                dbQueryTextAreaRef={dbQueryTextAreaRef}
            />

            <ResultPanel
                translatedResult={translatedResult}
                chartData={chartData}
                chartTicks={chartTicks}
                chartKeys={chartKeys}
                handleChartClicked={handleChartClicked}
                queryEvaluation={queryEvaluation}
                queryEvaluationReason={queryEvaluationReason}
            />

            <ActionButtons
                handleSaveQuery={handleSaveQuery}
                handleChat={handleChat}
                handleSaveData={handleSaveData}
                handleExportJsonl={handleExportJsonl}
                handleImportJsonl={handleImportJsonl}
                handleFinetune={handleFinetune}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                shared={shared}
                userChat={userChat}
                // table creation 
                handleOpenCreateDialog={handleOpenCreateDialog}
                handleOpenDeleteDialog={handleOpenDeleteDialog}
                handleCreateTable={handleCreateTable}
                handleDeleteTable={handleDeleteTable}
                handleCancelTable={handleCancelTable}
                isCreateModalOpen={isCreateModalOpen}
                isDeleteModalOpen={isDeleteModalOpen}
                createTableCount={createTableCount}
                // user chat
                setUserChat={setUserChat}
                handleChatReturn={handleChatReturn}
                getInputStyle={getInputStyle}

            />
            <br />
            By using this prototype preview, you agree to the <a target="_blank" href="/terms.html">Terms and Conditions</a>.

            <LoadingOverlay loading={loading} />
            <TermsModal />
            <ModalDialog
                open={dialogOpen}
                handleDialogClose={handleDialogClose}
                title="Success"
                content={`Action completed successfully!`}
            />
        </div>
    );
}
