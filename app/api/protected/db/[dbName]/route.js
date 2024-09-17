import Database from 'better-sqlite3';
const fs = require('fs');
const path = require('path');

export async function DELETE(request, { params }) {
    const {dbName} = params;
    console.log(dbName);
    
    if (dbName) {
      const directoryPath = path.join(process.cwd(), 'db');
      const filePath = path.join(directoryPath, dbName + '.db');

      // Function to delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting the file:', err);
          return;
        }
        console.log('File deleted successfully!');
      });
            
      return new Response(
        JSON.stringify(
          {
            status: 'ok'
          }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  
  };

}