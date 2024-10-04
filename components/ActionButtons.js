import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import CreateTableModal from './CreateTableModal';
import DeleteTableModal from './CreateTableModal';
import { FileUp, FileDown, MessageSquare, Save, Table, Trash2 } from "lucide-react";


const ActionButtons = ({ handleSaveQuery, handleSaveData, handleExportJsonl, handleImportJsonl,
  fileInputRef, handleFileChange, handleFinetune, shared, isCreateModalOpen, isDeleteModalOpen,
  handleCreateTable, handleDeleteTable, handleCancelTable, handleOpenCreateDialog, handleOpenDeleteDialog,
  createTableCount, handleChat, handleChatReturn, userChat, setUserChat }) => {
  const { data: session } = useSession(); // Get session data

  return (
    <div className="flex flex-col space-y-4 pt-4 bg-gray-100 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="relative w-1/2">
          <input
            className="w-full p-2 border rounded"
            value={userChat}
            autoComplete="off"
            id="customField22"
            style={{ width: '100%', boxSizing: 'border-box' }}
            onKeyDown={handleChatReturn}
            type="text"
            placeholder="Follow-up questions here"
            onChange={(e) => setUserChat(e.target.value)}
          />
        </div>
        <button onClick={handleChat} className="flex items-center">
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </button>
      </div>
      <div className="flex space-x-2">
      <button onClick={handleSaveQuery} className="flex items-center">
          <Save className="mr-2 h-4 w-4" />
          Save Query
        </button>
        {
          !shared && (session.user?.role == 'editor' || session.user?.role == 'admin') ?
            <>
              <button onClick={handleOpenCreateDialog} className="flex items-center">
                <Table className="mr-2 h-4 w-4" />Create Table
              </button>
              <button onClick={handleOpenDeleteDialog} variant="destructive" className="flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Table
              </button>
              <button onClick={handleExportJsonl} className="flex items-center">
                <FileDown className="mr-2 h-4 w-4" />
                Export JSONL
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center">
                <FileUp className="mr-2 h-4 w-4" />
                Import JSONL
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}  // Hide the actual file input
                onChange={handleFileChange}
              />
            </>
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
          createModal={true}
        />
        <DeleteTableModal
          open={isDeleteModalOpen}  // Control the open state
          handleCreateTable={handleDeleteTable}  // Function to handle Create action
          handleCancelTable={handleCancelTable}  // Function to handle Cancel action
          createTableCount={createTableCount}
          createModal={false}
        />

      </div>
    </div>
  );
};

export default ActionButtons;