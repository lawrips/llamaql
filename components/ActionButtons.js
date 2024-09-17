import React from 'react';
import { useSession } from "next-auth/react";

const ActionButtons = ({ handleSaveQuery, handleSaveData, handleExportJsonl, handleImportJsonl, fileInputRef, handleFileChange, handleFinetune, }) => {  
const { data: session } = useSession(); // Get session data

  return (
    <div>
      <button onClick={handleSaveQuery} style={{ marginRight: '10px', marginTop: '10px' }}>Save Query</button>
      {
        session.user?.role == 'editor' || session.user?.role == 'admin' ?
          <span>
            <button onClick={handleExportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Export JSONL</button>
            <button onClick={handleImportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Import JSONL</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}  // Hide the actual file input
              onChange={handleFileChange}
            />
          </span>
          : null}
      {
        //<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>
        //<button onClick={handleFinetune} style={{ marginRight: '10px', marginTop: '10px' }}>Begin Finetune</button>
      }
    </div>
  );
};

export default ActionButtons;