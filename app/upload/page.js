// pages/index.js
"use client";


import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import DragAndDrop from '../../lib/components/DragAndDrop';

export default function Home() {
  const [result, setResult] = useState(null);
  const [fileContents, setFileContents] = useState('');
  const [appName, setAppName] = useState('');

  useEffect(() => {
    console.log('Component mounted or updated');


    return () => {
      console.log('Cleanup');
    };
  }, []);

  const handleUpload = async (contents) => {
    if (appName) {
      setFileContents(contents);

      try {
        const response = await fetch(`/api/upload?app=${appName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contents)
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        let _result = await response.json();
        setResult(_result.count);
        return result;
      } catch (error) {
        console.error('Error in postData:', error);
        throw error;
      }
    }

  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Upload a CSV to get started</h1>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="app-name" className="block text-lg font-large text-gray-700">
            1. Enter an app name
          </label>
          <input
            maxLength={12}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={appName}
            onChange={(e) => setAppName(e.target.value.trim())}
            type="text"
            placeholder="Enter an App Name (1 word, no special chars)"
          />
        </div>

        <div>
          <label className="block text-lg font-large text-gray-700 mb-2">
            2. Upload a CSV file
          </label>
          <DragAndDrop onFileRead={handleUpload} />
        </div>

        {fileContents && result > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Successfully uploaded {result} rows</h2>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Access the app <a className="text-indigo-600 hover:text-indigo-500" target="_blank" href={`/?app=${appName}`}>here</a></p>
              </div>
              <div className="mt-3 text-sm">
                <details>
                  <summary className="text-indigo-600 cursor-pointer">View sample of uploaded content</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{fileContents.slice(0, 500)}</pre>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
