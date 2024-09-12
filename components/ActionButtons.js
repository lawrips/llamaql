import React from 'react';

const ActionButtons = ({ handleSaveQuery, handleSaveData, handleExportJsonl, handleFinetune }) => {
  return (
    <div>
      <button onClick={handleSaveQuery} style={{ marginRight: '10px', marginTop: '10px' }}>Save Query</button>
      {
      //<button onClick={handleSaveData} style={{ marginRight: '10px', marginTop: '10px' }}>Save Data</button>
      //<button onClick={handleExportJsonl} style={{ marginRight: '10px', marginTop: '10px' }}>Export training set (JSONL)</button>}
      //<button onClick={handleFinetune} style={{ marginRight: '10px', marginTop: '10px' }}>Begin Finetune</button>
      }
    </div>
  );
};

export default ActionButtons;