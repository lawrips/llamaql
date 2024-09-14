import React from 'react';

const ActionButtons = ({ handleSaveQuery, handleSaveData, handleExportJsonl, handleImportJsonl, fileInputRef, handleFileChange, handleFinetune }) => {
  return (
    <div>
      <button onClick={handleSaveQuery} style={{ marginRight: '10px', marginTop: '10px' }}>Save Query</button>
      <button onClick={handleExportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Export JSONL</button>
      <button onClick={handleImportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Import JSONL</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}  // Hide the actual file input
        onChange={handleFileChange}
      />
      {
      //<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>
      //<button onClick={handleFinetune} style={{ marginRight: '10px', marginTop: '10px' }}>Begin Finetune</button>
      }
    </div>
  );
};

export default ActionButtons;