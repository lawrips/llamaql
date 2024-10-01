import React,  { useState } from 'react';
import { useSession } from "next-auth/react";
import CreateTableModal from './CreateTableModal';  // Import the CreateTable component

const ActionButtons = ({ handleSaveQuery, handleSaveData, handleChat, handleChatReturn, handleExportJsonl, handleImportJsonl, fileInputRef, handleFileChange, handleFinetune, shared, isCreateModalOpen, setIsCreateModalOpen, handleCreateTable, handleCancelTable, handleOpenCreateDialog, createTableCount}) => {
  const { data: session } = useSession(); // Get session data

  return (
    <div>
      <button onClick={handleChat} style={{ marginRight: '10px', marginTop: '10px' }}>Chat</button>
      <button onClick={handleSaveQuery} style={{ marginRight: '10px', marginTop: '10px' }}>Save Query</button>
      {
        !shared && (session.user?.role == 'editor' || session.user?.role == 'admin') ?
          <span>
            <button onClick={handleOpenCreateDialog} style={{ marginRight: '10px', marginTop: '10px' }}>Create Table</button>
            <button onClick={handleExportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Export JSONL</button>
            <button onClick={handleImportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Import JSONL</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}  // Hide the actual file input
              onChange={handleFileChange}
            />
          </span>
          : null
      }
      {
        //<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>
        //<button onClick={handleFinetune} style={{ marginRight: '10px', marginTop: '10px' }}>Begin Finetune</button>
      }
      <CreateTableModal
        open={isCreateModalOpen}  // Control the open state
        handleCreateTable={handleCreateTable}  // Function to handle Create action
        handleCancelTable={handleCancelTable}  // Function to handle Cancel action
        createTableCount={createTableCount}
      />
    </div>
  );
};

export default ActionButtons;