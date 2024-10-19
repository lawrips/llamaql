import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const utils = require('@/lib/utils/shareUtils');
import Rag from '@/lib/rag/sqlite3/rag';
const path = require('path');
const Database = require('better-sqlite3');


const instructions = require('@/lib/constants/instructions')


export async function POST(request, {params}) {
    const { id } = params;
    const session = await getServerSession(authOptions);
    let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

    let json = await request.json();
    console.log(json);

    const directoryPath = path.join(process.cwd(), `db/${email}/`);

    const db = new Database(`${directoryPath}${dbName}.db`);
    db.pragma('journal_mode = WAL');


    console.log('Generating example queries...');
    // populate example q's if they're emptyy
    let stmt = db.prepare(`SELECT * FROM queries`);
    let existingQueries = stmt.all();
  
    stmt = db.prepare(`SELECT * FROM schema`);
    let schema = stmt.all();
    const rag =   new Rag(email, dbName);
  
  
    let examples = await rag.createExamples(instructions.generateQueryInstructions, JSON.stringify(schema.map(i => i.schema)), JSON.stringify(existingQueries.map(i => {return {userQuery: i.userQuery, userAnnotation: i.userAnnotation}})));

    return new Response(JSON.stringify({ examples: examples }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}


