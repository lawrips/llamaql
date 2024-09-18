// app/HomeClient.js
"use client";

import React from 'react';
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
        handleSaveInstructions
    } = useQueryState(appName);
    const { data: session } = useSession(); // Get session data

    if (session.user?.role == 'editor' || session.user?.role == 'admin') {

        return (
            <div style={{ padding: "10px" }}>
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
                    <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        models={models}
                    />
                    &nbsp;&nbsp;
                    <div>
                        <button onClick={() => handleQuery(false)}>Query</button>
                    </div>
                    &nbsp;&nbsp;
                    <div>
                        <button onClick={() => handleQuery(true)}>Fix Query</button>
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
    else {
        return (
            <div style={{ padding: "10px" }}>
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
                    <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        models={models}
                    />
                    &nbsp;&nbsp;
                    <div>
                        <button onClick={() => handleQuery(false)}>Query</button>
                    </div>
                    &nbsp;&nbsp;
                    <div>
                        <button onClick={() => handleQuery(true)}>Fix Query</button>
                    </div>
                </div>

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
}
