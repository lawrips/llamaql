// app/HomeClient.js
"use client";

import { React, useState } from 'react';
import { useSession } from "next-auth/react";
import { useQueryState } from '../hooks/useQueryState';
import QueryInput from '../components/QueryInput';
import AnnotationInput from '../components/AnnotationInput';
import ModelSelector from '../components/ModelSelector';
import InstructionPanel from '../components/InstructionPanel';
import ResultPanel from '../components/ResultPanel';
import ActionButtons from '../components/ActionButtons';
import LoadingOverlay from '../components/LoadingOverlay';
import ModalDialog from '@/components/ModalDialog';
import TermsModal from '@/components/TermsModal';
import { Search, Stars } from "lucide-react";


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
        setSelectedModel,
        loading,
        queryOptions,
        models,
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
        queryButtonText
    } = useQueryState(appName);
    const { data: session } = useSession(); // Get session data
    const [visibleTooltipIndex, setVisibleTooltipIndex] = useState(null);
    const tooltips = {
        0: 'Use this for simple queries or slight changes to exiting queries',
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
            <div className="flex w-full pb-4 pr-4">
                <div style={{ display: 'flex', gap: '20px' }}>
                    {/*<div style={{ position: 'relative', display: 'inline-block' }}>
                            {<ModelSelector
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                models={models}
                            />
                        </div>*/}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button onClick={() => {
                            handleQuery(false);
                            setVisibleTooltipIndex(null); // Hide tooltip on click
                        }}
                            onMouseEnter={() => setVisibleTooltipIndex(0)}
                            onMouseLeave={() => setVisibleTooltipIndex()}
                            className="flex items-center"

                        >
                            <Search className="mr-2 h-4 w-4" />
                            {queryButtonText} (fast)
                        </button>
                        {visibleTooltipIndex === 0 && (
                            <div className="tooltip">
                                {tooltips[0]}
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>

                        <button onClick={() => {
                            handleQuery(true);
                            setVisibleTooltipIndex(null); // Hide tooltip on click
                        }}
                            onMouseEnter={() => setVisibleTooltipIndex(1)}
                            onMouseLeave={() => setVisibleTooltipIndex()}
                            className="flex items-center"

                        >
                            <Stars className="mr-2 h-4 w-4" />
                            Deep {queryButtonText} (pro)
                        </button>
                        {visibleTooltipIndex === 1 && (
                            <div className="tooltip">
                                {tooltips[1]}
                            </div>
                        )}
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
            />

            <ResultPanel
                translatedResult={translatedResult}
                chartData={chartData}
                chartTicks={chartTicks}
                chartKeys={chartKeys}
                handleChartClicked={handleChartClicked}
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
