"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryState } from '../hooks/useQueryState';
import QueryInput from '../components/QueryInput';
import AnnotationInput from '../components/AnnotationInput';
import ModelSelector from '../components/ModelSelector';
import InstructionPanel from '../components/InstructionPanel';
import ResultPanel from '../components/ResultPanel';
import ActionButtons from '../components/ActionButtons';
import LoadingOverlay from '../components/LoadingOverlay';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ModalDialog from '@/components/ModalDialog'; 
import TermsModal from '@/components/TermsModal';

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    let appName = searchParams.get('app');

    useEffect(() => {
        if (!appName) {
            router.push('/upload');
        }
    }, [searchParams, router]);

    if (!appName) {
        return null;
      }
    
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
    

    return (
        <div style={{ padding: "10px" }}>
            <div className="col-span-2">
                <h3 className="text-xl font-bold mb-2"><a href="/upload">llamaql (v0.1)</a></h3>
            </div>
            <div className="flex w-full gap-4 p-4" >


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

                <AnnotationInput
                    annotation={annotation}
                    setAnnotation={setAnnotation}
                    setFocusedInput={setFocusedInput}
                    getInputStyle={getInputStyle}
                />
            </div>
            <div className="flex w-full gap-4 pl-4 pr-4 pb-4">
            <ModelSelector
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    models={models}
                />

                <div>
                    <button onClick={() => handleQuery(false)}>Query</button>
                </div>
                <div>
                    <button onClick={() => handleQuery(true)}>Requery</button>
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
            <br/>
            By using this research prototype, you agree to the <a target="_blank" href="/terms.html">Terms and Conditions</a>.

            <LoadingOverlay loading={loading} />
            <TermsModal />
            <ModalDialog
                open={dialogOpen}
                handleClose={handleDialogClose}
                title="Success"
                content={`Action completed successfuly!`}
            />


        </div>
    );
}