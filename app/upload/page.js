// pages/index.js
"use client";


import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import DragAndDrop from '../../lib/components/DragAndDrop';

export default function Home() {
  const [data, setData] = useState(null);
  const [fileContents, setFileContents] = useState('');
  const searchParams = useSearchParams();
  const appName = searchParams.get('app');


  useEffect(() => {
    console.log('Component mounted or updated');

    const fetchInitialOptions = async () => {

      try {
        const response = await fetch(`/api/upload?app=${appName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        let result = await response.json();
        console.log(result)
        setData('there are rows in the = ' + result.data.length);
      } catch (error) {
        console.error('Error in postData:', error);
        throw error;
      }
    }
    fetchInitialOptions();


    return () => {
      console.log('Cleanup');
    };
  }, []);

  const handleFileRead = async (contents) => {

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

      let result = await response.json();
      setFileContents(result.count);
      return result;
    } catch (error) {
      console.error('Error in postData:', error);
      throw error;
    }


  };

  // utils/parseWorkoutCSV.js

  // utils/parseWorkoutCSV.js



  return (
    <div>
      <h1>Next.js Page with useEffect</h1>
      <p>{data ? data : 'No data available'}</p>
      <DragAndDrop onFileRead={handleFileRead} />
      {fileContents && (
        <div>
          <h2>File Contents:</h2>
          <pre>{fileContents}</pre>
        </div>
      )}
    </div>
  );
}
