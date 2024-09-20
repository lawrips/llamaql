const fs = require('fs');
const path = require('path');
import Database from 'better-sqlite3';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    // Read and Filter .db files
    const session = await getServerSession(authOptions);
    const directoryPath = path.join(process.cwd(), `db/${session.user.email}/`);
    let files = fs.readdirSync(directoryPath);
    const dbFiles = files.filter(file => path.extname(file) === '.db');
    console.log(dbFiles);
  
    let data = [];
  
    if (dbFiles.length > 0) {
  
      try {
        for (const file of dbFiles) {
          const db = new Database(`${directoryPath}${file}`, { fileMustExist: true });
          db.pragma('journal_mode = WAL');
          const result = db.prepare(`SELECT count(*) as count FROM sqlite_master WHERE type = 'table' AND name like ?`).get(`data_%`);
          console.log('tables:')
          console.log(result.name)
          db.close();
          data.push({ file: file.replace(".db", ""), count: result.count });//count[0].rowCount });
        }
  
      } catch (ex) {
        console.log(ex);
      }
      return new Response(
        JSON.stringify(
          {
            data,
            status: 'ok'
          }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    else {
      return new Response(
        JSON.stringify(
          {
            data: [],
            status: 'DB not found - must supply /appname'
          }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  