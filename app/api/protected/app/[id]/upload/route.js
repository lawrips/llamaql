  import Database from 'better-sqlite3';
  const Papa = require('papaparse');
  const path = require('path');
  import { getServerSession } from "next-auth/next";
  import { authOptions } from "@/app/api/auth/[...nextauth]/route";
  import { NextResponse } from 'next/server';
  import AdmZip from 'adm-zip';
  import { Readable } from 'stream';

  const utils = require('@/lib/utils/typeUtils');
  const schemaUtils = require('@/lib/utils/schemaUtils');
  const instructions = require('@/lib/constants/instructions')

  import Rag from '@/lib/rag/sqlite3/rag';
  const rag = new Rag();
  const myDb = require('@/lib/services/sql');


  // Function to process a single CSV file
  const processCSV = async (db, csvContent, csvFilename, sendStatus) => {
    let result = await insertData(db, csvFilename.replace('.csv', ''), csvContent, sendStatus);
    schemaUtils.createSchema(db, csvFilename.replace('.csv', ''));
    return result;
  }

  export async function POST(request, { params }) {
    const { id } = params;
    const dbName = id;
    const csvFiles = [];
    if (dbName) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendStatus = (message) => {
            console.log(message);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: message })}\n\n`));
          };

          try {
            sendStatus('Receiving file data...');
            const formData = await request.formData();
            const file = formData.get('file');

            if (!file) {
              sendStatus('No file uploaded');
              controller.close();
              return;
            }

            // Access file properties
            const fileName = file.name; // Original filename
            const fileType = file.type; // MIME type
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            sendStatus('Processing uploaded file...');
            // process files first

            if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
              // Handle single CSV file
              const csvContent = buffer.toString('utf-8');
              csvFiles.push({
                fileName: fileName,
                content: csvContent,
              });
              sendStatus(`Detected file: ${fileName}`);


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

                  sendStatus(`Detected CSV in ZIP: ${entryName}`);
                }
              }

              if (csvFiles.length === 0) {
                sendStatus('No CSV files found in the ZIP');
                return NextResponse.json({ message: 'No CSV files found in the ZIP' }, { status: 400 });
              }

            } else {
              sendStatus('Unsupported file type uploaded');
              return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
            }
          } catch (error) {
            console.error('Error processing file:', error);
            sendStatus(`Error processing file: ${error.message}`);
            stream.push(null);
            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          }

          sendStatus('Setting up database...');
          const session = await getServerSession(authOptions);
          const directoryPath = path.join(process.cwd(), `db/${session.user.email}/`);

          const db = new Database(`${directoryPath}${dbName}.db`);
          db.pragma('journal_mode = WAL');

          try {
            db.exec(`DROP TABLE IF EXISTS query_data`);
            db.exec(`DROP TABLE IF EXISTS schema`);
            db.exec(`DROP TABLE IF EXISTS saved_data`);
            db.exec(`DROP TABLE IF EXISTS instructions`);
            sendStatus(`Tables have been dropped.`);

            const tableInfo = db.prepare("PRAGMA table_info(schema)").all();

            if (tableInfo.length === 0) {
              sendStatus("Table 'schema' was dropped successfully.");
            } else {
              sendStatus("Table 'schema' still exists.");
            }

            sendStatus('Processing CSV files...');
            // process each file
            if (csvFiles.length == 1) {
              csvFiles[0].count = await processCSV(db, csvFiles[0].content, dbName, sendStatus);
              sendStatus(`Processed ${csvFiles[0].fileName}: ${csvFiles[0].count} rows inserted.`);
            }
            else {
              for (const file of csvFiles) {
                sendStatus(`Processing ${file.fileName}...`);
                file.count = await processCSV(db, file.content, file.fileName, sendStatus);
                sendStatus(`Processed ${file.fileName}: ${file.count} rows inserted.`);
              }
            }

            sendStatus('Creating setup...');
            createSetup(db, sendStatus);

            sendStatus('Creating examples...');
            let schema = await createExamples(db, session.user.email, dbName, instructions, sendStatus);

            sendStatus('Creating schema explanation...');
            let explanation = await rag.createSchemaExplanation(instructions.schemaInstructions, JSON.stringify(schema.map(i => i.schema)), JSON.stringify(schema.map(i => i.examples)));
            db.prepare('INSERT INTO schema (schema) VALUES (?)').run([explanation]);


            db.close();
            sendStatus('Processing complete');
          } catch (error) {
            console.error('Error during database setup or processing:', error);
            sendStatus(`Error during processing: ${error.message}`);
            stream.push(null);
            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      return NextResponse.json({ status: 'DB not found - must supply /appname' }, { status: 404 });
    }
  }




  const createSetup = (db, sendStatus) => {
    sendStatus('Creating instructions table...');
    db.exec(`CREATE TABLE instructions (data TEXT);`);
    db.prepare('INSERT INTO instructions (data) VALUES (?)').run([JSON.stringify(instructions)]);
    sendStatus('Created instructions table.');

    db.exec(`CREATE TABLE IF NOT EXISTS queries (id INTEGER PRIMARY KEY, userQuery TEXT UNIQUE, userAnnotation TEXT, dbQuery TEXT, dbResult TEXT);`);
    sendStatus('Created queries table.');

    db.exec(`CREATE TABLE saved_data (id INTEGER PRIMARY KEY, data TEXT);`);
    sendStatus('Created saved_data table.');
  }

  const createExamples = async (db, email, dbName, instructions, sendStatus) => {
    sendStatus('Creating example queries...');
    // populate example q's if they're emptyy
    let stmt = db.prepare(`SELECT * FROM queries`);
    let existingQueries = stmt.all();

    stmt = db.prepare(`SELECT * FROM schema`);
    let schema = stmt.all();

    if (existingQueries.length == 0) {
      let examples = await rag.createExamples(instructions.setupInstructions, JSON.stringify(schema.map(i => i.schema)), JSON.stringify(schema.map(i => i.examples)));
      sendStatus('Generated example queries.');

      for (let example of examples) {
        myDb.run(email, dbName,
          `INSERT INTO queries (userQuery, userAnnotation) 
        VALUES (?, ?)
        ON CONFLICT(userQuery) 
        DO UPDATE SET 
          userAnnotation = excluded.userAnnotation
          WHERE queries.userQuery = excluded.userQuery`,
          [example.query, example.annotation]);
        //sendStatus(`Inserted example query: ${example.query}`);
      }

    } else {
      sendStatus('Existing queries found. Skipping example creation.');
    }
    return schema;
  }

  const createDataTable = (db, tableName, parsedData, sendStatus) => {
    sendStatus(`Creating data table for ${tableName}...`);
    const columnTypes = utils.determineColumnTypes(parsedData);
    let sanitizedHeaders = [];

    const columns = parsedData.meta.fields.map((header, index) => {
      const sanitizedHeader = utils.sanitizeHeader(header, sanitizedHeaders);
      const sqlType = columnTypes[index];
      return `"${sanitizedHeader}" ${sqlType}`;
    }).join(', ');

    db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
    db.exec(`DROP TABLE IF EXISTS data_${tableName}`);

    sendStatus(`Creating table data_${tableName}`);
    db.exec(`CREATE TABLE IF NOT EXISTS data_${tableName} (${columns})`);
    sendStatus(`Table data_${tableName} created successfully.`);
  };

  const normalizeLineBreaks = (data) => {
    // Replace all types of line breaks with a standard '\n'
    return data.replace(/\r\n|\r|\n/g, '\n');
  };

  const insertData = async (db, tableName, data, sendStatus) => {
    const normalizedData = normalizeLineBreaks(data);

    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(normalizedData, {
        delimiter: guessDelimiter(data),
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (result) => {
          if (result.errors.length) {
            console.error('Parsing errors:', result.errors);
          }
          resolve(result);
        },
        error: (error) => reject(error)

      });
    });


    sendStatus('Sanitizing headers...');
    let sanitizedHeaders = [];
    const headers = parsedData.meta.fields.map(header => utils.sanitizeHeader(header, sanitizedHeaders));

    sendStatus('Creating data table...');
    createDataTable(db, tableName, parsedData, sendStatus);

    const placeholders = headers.map(() => '?').join(', ');
    const insertStmt = db.prepare(`INSERT INTO data_${tableName} (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${placeholders})`);
    sendStatus('Prepared SQL insert statement.');

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
    sendStatus(`Inserted ${result} rows into data_${tableName}.`);

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
