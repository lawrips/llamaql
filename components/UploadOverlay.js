import React, { useEffect, useRef } from 'react';

const UploadOverlay = ({ loading, statusMessages, onDismiss }) => {
  const messagesEndRef = useRef(null);
  const isComplete = statusMessages[statusMessages.length - 1]?.includes('Processing complete');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [statusMessages]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {isComplete ? "Upload Complete" : "Uploading and Processing..."}
        </h2>
        {!isComplete && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
        )}
        <div className="mt-4 h-40 overflow-y-auto border border-gray-200 p-2 rounded">
          {statusMessages.length === 0 && <p className="text-sm text-gray-600">Initializing...</p>}
          {statusMessages.map((message, index) => (
            <p key={index} className="text-sm text-gray-600">{message}</p>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {isComplete && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadOverlay;
