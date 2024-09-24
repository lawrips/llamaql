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

export default function HomeClient({ appName }) {
    const {
        userQuery,
        setUserQuery,
        annotation,
        setAnnotation,
        dbQuery,
        setDbQuery,
        chatResult,
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
        setFocusedInput,
        getInputStyle,
        handleKeyDown,
        dialogOpen,
        handleDialogClose,
        handleSaveInstructions,
        shared
    } = useQueryState(appName);
    const { data: session } = useSession(); // Get session data
    const [visibleTooltipIndex, setVisibleTooltipIndex] = useState(null);
    const tooltips = {
        0: 'Use this by default. It will send use your query + hint as context',
        1: 'Use this when stuck. It wil send your query + hint + the failed query as context',
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
                        setFocusedInput={setFocusedInput}
                        getInputStyle={getInputStyle}
                        handleKeyDown={handleKeyDown}
                        shared={shared}
                    />
                    &nbsp;&nbsp;
                    <AnnotationInput
                        annotation={annotation}
                        setAnnotation={setAnnotation}
                        setFocusedInput={setFocusedInput}
                        getInputStyle={getInputStyle}
                    />
                </div>
                <div className="flex w-full pb-4 pr-4">
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <ModelSelector
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                models={models}
                            />
                        </div>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button onClick={() => handleQuery(false)}
                                onMouseEnter={() => setVisibleTooltipIndex(0)}
                                onMouseLeave={() => setVisibleTooltipIndex()}
                            >Query</button>
                            {visibleTooltipIndex === 0 && (
                                <div className="tooltip">
                                    {tooltips[0]}
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative', display: 'inline-block' }}>

                            <button onClick={() => handleQuery(true)}
                                onMouseEnter={() => setVisibleTooltipIndex(1)}
                                onMouseLeave={() => setVisibleTooltipIndex()}
                            >Fix Query</button>
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
                    instructSubs={instructSubs}
                    checkedItems={checkedItems}
                    handleInstructSubChange={handleInstructSubChange}
                    handleDirectQuery={handleDirectQuery}
                    handleSaveInstructions={handleSaveInstructions}
                />

                <ResultPanel
                    chatResult={chatResult}
                    chartData={chartData}
                    chartTicks={chartTicks}
                    chartKeys={chartKeys}
                />

                <ActionButtons
                    handleSaveQuery={handleSaveQuery}
                    handleSaveData={handleSaveData}
                    handleExportJsonl={handleExportJsonl}
                    handleImportJsonl={handleImportJsonl}
                    handleFinetune={handleFinetune}
                    fileInputRef={fileInputRef}
                    handleFileChange={handleFileChange}
                    shared={shared}
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
