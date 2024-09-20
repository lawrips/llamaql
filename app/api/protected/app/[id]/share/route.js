import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
const fs = require('fs');
const path = require('path')
const utils = require('@/lib/utils/shareUtils');


export async function POST(request, { params }) {
  const { id } = params;
  const dbName = id;
  const session = await getServerSession(authOptions);
    console.log("**** SHARE POST ****** ")
    
    if (dbName) {
      let directoryPath = path.join(process.cwd(), `db/${session.user.email}/`);
      const filePath = path.join(directoryPath, dbName + '.db');
      if (fs.existsSync(filePath)) {              

        let hash = utils.enableSharing(session.user.email, dbName);

        return new Response(
          JSON.stringify(
            {
              status: 'ok',
              hash: hash
            }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      else {
        return new Response(
          JSON.stringify(
            {
              status: 'DB does not exist'
            }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }); 
      }
  };

}