// app/HomeClient.js
"use client";

import React, { useState } from 'react';
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
import Switch from 'react-switch';
import QueryControls from '../components/QueryControls';

const modelOptions = [
    { header: 'Cheaper and Faster', selectable: false },
    { value: 'google/gemini-flash-1.5', display: 'Gemini 1.5 Flash', selectable: true },
    { value: 'openai/gpt-4o-mini', display: 'GPT-4o Mini', selectable: true },
    { value: 'anthropic/claude-3-5-haiku', display: 'Claude 3.5 Haiku', selectable: true },
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
        displayedQuery,
        setDbQuery,
        setDisplayedQuery, 
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
        queryTextAreaRef,
        handleModelSelect,
        queryEvaluation,
        queryEvaluationReason,
        handleGenerateQuery,
        deepSearch,
        setDeepSearch,
        expectedResults,
        setExpectedResults,
        showQueryDetails,
        setShowQueryDetails,
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
                <div className="w-full">
                    <QueryControls
                        handleQuery={handleQuery}
                        queryButtonText={queryButtonText}
                        selectedModel={selectedModel}
                        handleModelSelect={handleModelSelect}
                        modelOptions={modelOptions}
                        setDeepSearch={setDeepSearch}
                        deepSearch={deepSearch}
                        setVisibleTooltip={setVisibleTooltip}
                        visibleTooltip={visibleTooltip}
                        tooltips={tooltips}
                        expectedResults={expectedResults}
                        setExpectedResults={setExpectedResults}
                    />
                </div>
            </div>

            <InstructionPanel
                displayedQuery={displayedQuery}
                setDisplayedQuery={setDisplayedQuery}
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
                queryTextAreaRef={queryTextAreaRef}
                showQueryDetails={showQueryDetails}
                setShowQueryDetails={setShowQueryDetails}
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
