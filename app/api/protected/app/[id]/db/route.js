const fs = require('fs');
const path = require('path');
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
const utils = require('@/lib/utils/shareUtils');

export async function DELETE(request, { params }) {
    const {id} = params;
    const session = await getServerSession(authOptions);
    let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

    if (dbName) {

      const directoryPath = path.join(process.cwd(), `db/${email}/`);
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