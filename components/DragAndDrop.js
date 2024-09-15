"use client";
import { useState, useRef } from 'react';

const DragAndDrop = ({ onFileRead }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current.click(); // Opens the file dialog
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = (event) => {
    event.preventDefault(); // Prevent default form action, if any
    event.stopPropagation(); // Prevent the click from bubbling up to the parent div
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target.result;
        onFileRead(fileContents); // Trigger the file read callback
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick} // Opens the file dialog when clicked
      className="border-2 border-dashed border-gray-400 rounded-lg p-5 text-center m-5 transition-colors duration-300 ease-in-out hover:border-indigo-500"
      style={{
        border: '2px dashed #ccc',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        margin: '20px',
        cursor: 'pointer',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }} // Hidden file input
        onChange={handleFileChange}
      />
      {file ? (
        <div className="space-y-4">
          <p className="text-gray-700">File: {file.name}</p>
          <button
            onClick={handleUpload} // Upload the file
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
