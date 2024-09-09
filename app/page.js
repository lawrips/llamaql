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

export default function Home() {
  const searchParams = useSearchParams();
  const appName = searchParams.get('app');
  const {
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
    handleOptionSelect,
    handleQuery,
    handleDirectQuery,
    handleSaveQuery,
    handleSaveData,
    handleExportJsonl,
    handleFinetune,
    queryInstructions,
    setQueryInstructions,
    dataInstructions,
    setDataInstructions,
    dataSchema,
    setDataSchema,
    instructSubs,
    checkedItems,
    handleInstructSubChange,
    showDropdown,
    setShowDropdown,
  } = useQueryState(appName);

  return (
    <div style={{ padding: '10px' }}>
      <div className="grid-container">
        <div className="col-span-2">
          <h3 className="text-xl font-bold mb-2">QGEN (v0.1)</h3>
        </div>
        
        <QueryInput
          userQuery={userQuery}
          setUserQuery={setUserQuery}
          queryOptions={queryOptions}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          handleOptionSelect={handleOptionSelect}
        />
        
        <AnnotationInput
          annotation={annotation}
          setAnnotation={setAnnotation}
        />
        
        <ModelSelector
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
        />
        
        <div className="col-span-1">
          <button onClick={handleQuery}>Query</button>
        </div>
      </div>

      <InstructionPanel
        dbQuery={dbQuery}
        setDbQuery={setDbQuery}
        queryInstructions={queryInstructions}
        setQueryInstructions={setQueryInstructions}
        dataInstructions={dataInstructions}
        setDataInstructions={setDataInstructions}
        dataSchema={dataSchema}
        setDataSchema={setDataSchema}
        instructSubs={instructSubs}
        checkedItems={checkedItems}
        handleInstructSubChange={handleInstructSubChange}
        handleDirectQuery={handleDirectQuery}
      />

      <ResultPanel
        chatResult={chatResult}
        chartData={chartData}
      />

      <ActionButtons
        handleSaveQuery={handleSaveQuery}
        handleSaveData={handleSaveData}
        handleExportJsonl={handleExportJsonl}
        handleFinetune={handleFinetune}
      />

      <LoadingOverlay loading={loading} />
    </div>
  );
}