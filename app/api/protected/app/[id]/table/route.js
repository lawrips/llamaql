const path = require('path');
import Database from 'better-sqlite3';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const schemaUtils = require('@/lib/utils/schemaUtils');
const myDb = require('@/lib/services/sql');
const instructions = require('@/lib/constants/instructions')
import Rag from '@/lib/rag/sqlite3/rag';
const rag = new Rag();

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = params;
    const dbName = id;

    const body = await request.json();

    
    // extracts [tablename] if it is exists
    let tableName = 'newtable';
    const extracted = body.userAnnotation ? (body.userAnnotation.match(/\[(.*?)\]/g) || []).map(match => match.slice(1, -1)) : null;
    if (extracted) {
        tableName = extracted[0];
    }


    const directoryPath = path.join(process.cwd(), `db/${session.user.email}/`);
    const db = new Database(`${directoryPath}${dbName}.db`);
    db.pragma('journal_mode = WAL');

    let result = myDb.run(session.user.email, id, `DROP TABLE IF EXISTS data_${tableName}`, []);
    result = myDb.run(session.user.email, id, `CREATE TABLE data_${tableName} AS\n ${body.dbQuery}`, []);

    // delete existing explanation and if this schema has already been added
    db.prepare(`DELETE FROM schema WHERE id = (SELECT MAX(id) FROM schema)`).run([]);  
    db.prepare(`DELETE FROM schema WHERE name = ?`).run([`data_${tableName}`]);  

    // adds this new table to the schema
    schemaUtils.createSchema(db, tableName);

    // fetch updated schemas
    let stmt = db.prepare(`SELECT * FROM schema`);
    let schema = stmt.all();
  
    // regenerates the schema explanation and stores it
    let explanation = await rag.createSchemaExplanation(instructions.schemaInstructions, JSON.stringify(schema.map(i => i.schema)), JSON.stringify(schema.map(i => i.examples)));
    db.prepare('INSERT INTO schema (schema) VALUES (?)').run([explanation]);  

    db.close();

    return new Response(JSON.stringify({ message: 'Table Created!' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function DELETE(request, { params }) {
    const { id } = params;

    let json = await request.json();
    console.log(json);

    return new Response(JSON.stringify({ message: 'Query result deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
