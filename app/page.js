"use client";

import { useEffect, useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { X } from 'lucide-react';

import TermsModal from '@/components/TermsModal';
import ModalDialog from '@/components/ModalDialog';
import withAuth from "./hoc/withAuth";
import DragAndDrop from '@/components/DragAndDrop';
import UploadOverlay from '@/components/UploadOverlay';

function UploadPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState(null);
  const [fileContents, setFileContents] = useState('');
  const [appName, setAppName] = useState('');
  const [dbFile, setDbFile] = useState(null); // For deletion
  const [dbFiles, setDbFiles] = useState([]); // For display
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    console.log('Component mounted or updated');

    const fetchData = async () => {
      const data = await load();
      setDbFiles(data.data);
    };

    fetchData();

  }, []);

  const handleUpload = async (formData) => {
    if (!appName) {
      console.error('App name is not defined');
      return;
    }

    setLoading(true);
    setShowOverlay(true);
    setStatusMessages(['Starting upload...']);

    // Increase retry limits and add backoff
    const maxRetries = 5;  // Increased from 3
    const baseDelay = 2000; // 2 seconds base delay

    try {
      const response = await fetch(`/api/protected/app/${appName}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let retryCount = 0;
      let buffer = '';
      let lastMessageTime = Date.now();

      while (true) {
        try {
          const { done, value } = await reader.read();
          
          // Update last successful message time
          lastMessageTime = Date.now();

          if (done) {
            console.log('Stream complete');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.trim() && part.startsWith('data: ')) {
              try {
                const data = JSON.parse(part.slice(6));
                setStatusMessages(prev => [...prev, data.status]);
                retryCount = 0; // Reset retry count on successful message
              } catch (parseError) {
                console.warn('Failed to parse message:', part, parseError);
              }
            }
          }

        } catch (streamError) {
          console.warn('Stream error:', streamError);
          retryCount++;
          
          // Calculate exponential backoff delay
          const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 10000);
          
          if (retryCount >= maxRetries) {
            throw new Error('Upload process interrupted. Please try again.');
          }

          // Check if we've received any messages in the last 30 seconds
          const currentTime = Date.now();
          const timeSinceLastMessage = currentTime - lastMessageTime;
          if (timeSinceLastMessage > 30000) {
            throw new Error('Upload process interrupted. Please try again.');
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

    } catch (error) {
      console.error('Error during upload:', error);
      setStatusMessages(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDb = async (dbName) => {
    console.log('db clicked');
    setDialogOpen(true);
    setDbFile(dbName);
  }

  const handleDialogConfirm = async () => {
    setDialogOpen(false);

    try {
      const response = await fetch(`/api/protected/app/${dbFile}/db`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete database');
      }

      const data = await load();
      setDbFiles(data.data);
    } catch (error) {
      console.error('Error deleting database:', error);
      setStatusMessages(prev => [...prev, `Error deleting database: ${error.message}`]);
    }
  }

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setDbFile(null);
  }

  const load = async () => {
    const response = await fetch(`/api/protected/load-setup`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data;
  }

  const handleDismiss = () => {
    setShowOverlay(false);
    setStatusMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-2">
        {/* Title aligned to the left */}
        <h1 className="text-2xl font-bold">
          <a href="/">llamaql (v0.1)</a>
        </h1>

        {/* User's name and logout button aligned to the right */}
        <div className="flex items-center space-x-4">
          {session && session.user && (
            <>
              <p className="text-lg">Welcome, {session.user.name}!</p>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
      <div className="w-3/4 max-w-2xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Select or Upload a new CSV</h1>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Option 1: Select a DB</h2>

          <div className="grid grid-cols-2 gap-4 p-4">
            {dbFiles.map((item, index) => (
              <div key={index} className="relative border p-4 rounded shadow">
                <span>
                  <center>
                    <p><strong><a href={`/${item.file}`}>{item.file}</a></strong></p>
                    <p><a href={`/${item.file}`}>({item.count} files)</a></p>
                    <X
                      color="red"
                      size={20}
                      className="absolute top-0 right-0 text-gray-400 cursor-pointer"
                      onClick={() => deleteDb(item.file)}
                    />
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

          {result > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Successfully uploaded {result} rows</h2>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Access the app <a className="text-indigo-600 hover:text-indigo-500" target="_blank" href={`/${appName}`}>here</a></p>
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
        By using this prototype preview, you agree to the <a target="_blank" href="/terms.html">Terms and Conditions</a>.
      </div>
      {showOverlay && (
        <UploadOverlay 
          loading={loading} 
          statusMessages={statusMessages} 
          onDismiss={handleDismiss}
        />
      )}
      <ModalDialog
        open={dialogOpen}
        handleDialogClose={handleDialogConfirm}
        handleDialogCancel={handleDialogCancel}
        title="Confirmation"
        content={`This will delete the database "${dbFile}". Continue?`}
      />
      <TermsModal />
    </div>
  );
}

export default withAuth(UploadPage);
