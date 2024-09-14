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
      className="border-2 border-dashed border-gray-400 rounded-lg p-5 text-center m-5 transition-colors duration-300 ease-in-out hover:border-indigo-500"
      style={{
        border: '2px dashed #ccc',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        margin: '20px',
      }}

    >
      {file ? (
        <div className="space-y-4">
          <p className="text-gray-700">File: {file.name}</p>
          <button
            onClick={handleUpload}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 ease-in-out"
          >
            Upload
          </button>
        </div>
      ) : (
        <p className="text-gray-500">Drag and drop a file here, or click to select a file</p>
      )}
    </div>
  );
};

export default DragAndDrop;
