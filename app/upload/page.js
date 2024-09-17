// pages/index.js
"use client";


import { useEffect, useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { X } from 'lucide-react';

import TermsModal from '@/components/TermsModal';
import ModalDialog from '@/components/ModalDialog';
import withAuth from "../hoc/withAuth";
import DragAndDrop from '../../components/DragAndDrop';

function UploadPage() {
  const [result, setResult] = useState(null);
  const [fileContents, setFileContents] = useState('');
  const [appName, setAppName] = useState('');
  const [dbFile, setDbFile] = useState([]); // for deletion
  const [dbFiles, setDbFiles] = useState([]); // for display
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: session } = useSession(); // Get session data

  useEffect(() => {
    console.log('Component mounted or updated');

    const fetchData = async () => {
      const data = await load();
      setDbFiles(data.data);
    };

    fetchData();

  }, []);

  const handleUpload = async (contents) => {
    if (appName) {
      setFileContents(contents);

      try {
        const response = await fetch(`/api/protected/upload?app=${appName}`, {
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

  const deleteDb = async (dbName) => {
    console.log('db clicked')
    setDialogOpen(true);
    setDbFile(dbName);
  }



  const handleDialogConfirm = async () => {
    setDialogOpen(false);

    const response = await fetch(`/api/protected/db/${dbFile}`, {
      method: 'DELETE',
    });

    const fetchData = async () => {
      const data = await load();
      setDbFiles(data.data);
    };

    fetchData();
  }

  const handleDialogCancel = async () => {
    setDialogOpen(false);
  }

  const load = async () => {
    const response = await fetch(`/api/protected/upload`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    return data;
  }



  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-2"> 
        {/* Title aligned to the left */}
        <h1 className="text-2xl font-bold">
          <a href="/upload">llamaql (v0.1)</a>
        </h1>

        {/* User's name and logout button aligned to the right */}
        <div className="flex items-center space-x-4">
          <p className="text-lg">Welcome, {session.user?.name}!</p>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="w-3/4 max-w-2xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Select or Upload a new CSV</h1>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Option 1: Select a DB</h2>

          <div className="grid grid-cols-3 gap-4 p-4">
            {dbFiles.map((item, index) => (
              <div key={index} className="relative border p-4 rounded shadow">
                <span>
                  <center>
                    <p><strong><a href={`/?app=${item.file}`}>{item.file}</a></strong> </p>
                    <p><a href={`/?app=${item.file}`}>({item.count >= 1000000 ? (item.count / 1000000).toFixed(1) + 'm' : item.count >= 1000 ? (item.count / 1000).toFixed(0) + 'k' : item.count.toString()} rows)</a></p>
                    <br />
                    <X
                      color="red"
                      size={20}
                      className="absolute top-0 right-0 text-gray-400 cursor-pointer" onClick={() => deleteDb(item.file)} />
                  </center>
                </span>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">OR</h2>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Option 2: Upload a CSV</h2>

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
        <br />
        By using this research prototype, you agree to the <a target="_blank" href="/terms.html">Terms and Conditions</a>.
      </div>
      <ModalDialog
        open={dialogOpen}
        handleDialogClose={handleDialogConfirm}
        handleDialogCancel={handleDialogCancel}
        title="Confirmation"
        content={`This will delete this database for all users. Continue?`}
      />
      <TermsModal />
    </div >
  );
}

export default withAuth(UploadPage);
