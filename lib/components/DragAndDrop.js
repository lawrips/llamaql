// components/DragAndDrop.js

"use client"; 

import { useEffect, useState } from 'react';

const DragAndDrop = ({ onFileRead }) => {
  const [file, setFile] = useState(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target.result;
        onFileRead(fileContents);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        margin: '20px',
      }}
    >
      {file ? (
        <div>
          <p>File: {file.name}</p>
          <button onClick={handleUpload}>Upload</button>
        </div>
      ) : (
        <p>Drag and drop a file here, or click to select a file</p>
      )}
    </div>
  );
};

export default DragAndDrop;
