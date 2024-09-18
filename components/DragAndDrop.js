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
    event.preventDefault(); // Prevent default form action
    //event.stopPropagation(); // Prevent the click from bubbling up to the parent div

    if (file) {
      console.log(file)
      const formData = new FormData();
      formData.append('file', file); // Append the file to form data
      console.log(formData)
      onFileRead(formData); // Callback when the file is successfully uploaded
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      //onClick={handleClick} // Opens the file dialog when clicked
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
      <form onSubmit={handleUpload}>

        <input
          type="file"
          style={{ display: 'none' }} // Hidden file input
          onChange={handleFileChange}
          accept=".csv,.zip"
        />
        {file ? (
          <div className="space-y-4">
            <p className="text-gray-700">File: {file.name}</p>
            <button
              type="submit" // Upload the file
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 ease-in-out"
            >
              Upload
            </button>
          </div>
        ) : (
          <p className="text-gray-500">Drag and drop a file here, or click to select a file</p>
        )}
      </form>
    </div>
  );
};

export default DragAndDrop;
