import Database from 'better-sqlite3';
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

const utils = require('@/lib/utils/typeUtils');
const instructions = require('@/lib/constants/instructions')

import Rag from '@/lib/rag/sqlite3/rag';
const myDb = require('@/lib/services/sql');


// Function to process a single CSV file
const processCSV = async (db, csvContent, csvFilename) => {
  // insert csv data into sql table
  let result = await insertData(db, csvFilename.replace('.csv', ''), csvContent);
  // create dataSchema for this table
  createSchema(db, csvFilename.replace('.csv', ''));

  return result;
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');
  if (dbName) {
    const csvFiles = [];

    try {
      const formData = await request.formData();

      const file = formData.get('file'); // 'file' is the name of the form field

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }


      // Access file properties
      const fileName = file.name; // Original filename
      const fileType = file.type; // MIME type
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // process files first

      if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        // Handle single CSV file
        const csvContent = buffer.toString('utf-8');
        csvFiles.push({
          fileName: fileName,
          content: csvContent,
        });


      } else if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
        // Handle ZIP file
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // Extract and process each CSV file in the ZIP
        for (const entry of zipEntries) {
          const entryName = entry.entryName;
          if (entryName.endsWith('.csv')) {
            const csvContent = entry.getData().toString('utf-8');
            csvFiles.push({
              fileName: entryName,
              content: csvContent,
            });

            console.log('Detected ' + entryName);
          }
        }

        if (csvFiles.length === 0) {
          return NextResponse.json({ message: 'No CSV files found in the ZIP' }, { status: 400 });
        }

      }
    } catch (error) {
      console.error('Error processing file:', error);
      return NextResponse.json({ message: 'Error processing file' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    const directoryPath = path.join(process.cwd(), `db/${session.user.email}/`);

    const db = new Database(`${directoryPath}${dbName}.db`);
    db.pragma('journal_mode = WAL');

    db.exec(`DROP TABLE IF EXISTS query_data`);
    db.exec(`DROP TABLE IF EXISTS data_schema`);
    //db.exec(`DROP TABLE IF EXISTS queries`);
    db.exec(`DROP TABLE IF EXISTS saved_data`);
    db.exec(`DROP TABLE IF EXISTS instructions`);
    console.log(`Tables have been dropped.`);

    const tableInfo = db.prepare("PRAGMA table_info(data_schema)").all();

    if (tableInfo.length === 0) {
      console.log("Table 'data_schema' was dropped successfully.");
    } else {
      console.log("Table 'data_schema' still exists.");
    }

    // process each file
    for (const file of csvFiles) {
      console.log('processing ' + file.fileName);
      file.count = await processCSV(db, file.content, file.fileName);
      console.log('count: ' + file.count)
    }

    // one time setup for instructions, etc
    createSetup(db);

    // populate example q's

    const stmt = db.prepare(`SELECT * FROM data_schema`);
    let schema = stmt.all();

    const rag = new Rag();
    let examples = await rag.createExamples(instructions.setupInstructions, schema[0].schema, schema[0].examples);
    console.log(examples);

    for (let example of examples) {
      myDb.run(session.user.email, dbName, 
      `INSERT INTO queries (userQuery, userAnnotation) 
      VALUES (?, ?)
      ON CONFLICT(userQuery) 
      DO UPDATE SET 
        userAnnotation = excluded.userAnnotation
        WHERE queries.userQuery = excluded.userQuery`,
        [example.query, example.annotation]);
    }
    db.close();

    return new Response(
      JSON.stringify(
        {
          message: 'Processed successfully',
          csvFiles: csvFiles.map(file => { return { fileName: file.fileName, count: file.count } }),
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
          status: 'DB not found - must supply ?app=appname'
        }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

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
        //const stmt = db.prepare(`SELECT count(*) as rowCount FROM query_data`);
        //let count = stmt.all();
        let count = 0;
        console.log(count)
        db.close();
        data.push({ file: file.replace(".db", ""), count: 0 });//count[0].rowCount });
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
          status: 'DB not found - must supply ?app=appname'
        }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}



const createSetup = async (db) => {

  db.exec(`CREATE TABLE instructions (data TEXT);`);
  db.prepare('INSERT INTO instructions (data) VALUES (?)').run([JSON.stringify(instructions)]);
  console.log('created instructions')

  db.exec(`CREATE TABLE IF NOT EXISTS queries (id INTEGER PRIMARY KEY, userQuery TEXT UNIQUE, userAnnotation TEXT, dbQuery TEXT, dbResult TEXT);`);

  console.log('created queries')

  db.exec(`CREATE TABLE saved_data (id INTEGER PRIMARY KEY, data TEXT);`);
  console.log('created saved_data')
}

const createSchema = (db, tableName) => {

  db.exec(`
      CREATE TABLE IF NOT EXISTS data_schema (id INTEGER PRIMARY KEY, schema TEXT, examples TEXT
      );
    `);

  let schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(`data_${tableName}`);

  console.log('schema:')
  console.log(schema.sql);

  const stmt = db.prepare(`SELECT * FROM data_${tableName}`);
  let exampleData = stmt.all();
  console.log('exampleData:')
  console.log(exampleData[0])



  // Insert the text row
  db.prepare('INSERT INTO data_schema (schema, examples) VALUES (?, ?)').run([schema.sql, JSON.stringify(exampleData.slice(0, 5))]);

  console.log('created schema')
}

const createDataTable = (db, tableName, parsedData) => {

  const columnTypes = utils.determineColumnTypes(parsedData);
  let sanitizedHeaders = [];

  const columns = parsedData.meta.fields.map((header, index) => {
    const sanitizedHeader = utils.sanitizeHeader(header, sanitizedHeaders);
    const sqlType = columnTypes[index];
    return `${sanitizedHeader} ${sqlType}`;
  }).join(', ');

  let createStmt = `DROP TABLE IF EXISTS ${tableName}`;
  db.exec(createStmt);
  createStmt = `DROP TABLE IF EXISTS data_${tableName}`;
  db.exec(createStmt);

  console.log('columns:');
  console.log(columns)
  createStmt = `CREATE TABLE IF NOT EXISTS data_${tableName} (${columns})`;
  db.exec(createStmt);
  console.log('table created')
};

const insertData = async (db, tableName, data) => {
  const parsedData = await new Promise((resolve, reject) => {
    Papa.parse(data, {
      delimiter: guessDelimiter(data),
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => resolve(result),
      error: (error) => reject(error)
    });
  });


  console.log('about to sanitize headers')
  let sanitizedHeaders = [];
  const headers = parsedData.meta.fields.map(header => utils.sanitizeHeader(header, sanitizedHeaders));
  console.log('headers:')
  console.log(headers)
  console.log('parsedData')
  createDataTable(db, tableName, parsedData);

  const placeholders = headers.map(() => '?').join(', ');
  const insertStmt = db.prepare(`INSERT INTO data_${tableName} (${headers.join(', ')}) VALUES (${placeholders})`);
  console.log('insertStmt:');
  console.log(insertStmt.source)

  const transaction = db.transaction((parsedData) => {
    let count = 0;
    parsedData.data.forEach((row) => {

      // Access data by original header name instead of relying on order:
      const values = parsedData.meta.fields.map(header => row[header]);
      const result = insertStmt.run(values);
      count += result.changes;
    });
    return count;
  });

  const result = transaction(parsedData);
  console.log(`Inserted ${result} rows`);

  return result;
};


function guessDelimiter(csvString) {
  // Analyze the first line or two of the CSV data
  const lines = csvString.split('\n').slice(0, 2); // First two lines
  const sample = lines.join('\n');

  const delimiters = [',', ';', '\t', '|'];
  let delimiterCount = {};

  // Count occurrences of each delimiter in the sample
  delimiters.forEach((delimiter) => {
    const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    delimiterCount[delimiter] = count;
  });

  // Find the delimiter with the highest occurrence
  return Object.keys(delimiterCount).reduce((a, b) =>
    delimiterCount[a] > delimiterCount[b] ? a : b
  );
}
