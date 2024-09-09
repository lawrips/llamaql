import React from 'react';

const ModelSelector = ({ selectedModel, setSelectedModel, models }) => {
  return (
    <div>
      <select
        id="models"
        name="models"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option value="">Select a model</option>
        {models.map((model, index) => (
          <option key={index} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;