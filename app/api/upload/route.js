import Database from 'better-sqlite3';
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

const utils = require('../../../lib/utils/typeUtils');
const instructions = require('../../../lib/constants/instructions')

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');
  const contents = await request.json();

  if (dbName) {
    const db = new Database(`./db/${dbName}.db`);
    db.pragma('journal_mode = WAL');

    db.exec(`DROP TABLE IF EXISTS query_data`);
    db.exec(`DROP TABLE IF EXISTS data_schema`);
    db.exec(`DROP TABLE IF EXISTS queries`);
    db.exec(`DROP TABLE IF EXISTS saved_data`);
    db.exec(`DROP TABLE IF EXISTS instructions`);
    console.log(`Tables have been dropped.`);

    const tableInfo = db.prepare("PRAGMA table_info(data_schema)").all();

    if (tableInfo.length === 0) {
      console.log("Table 'data_schema' was dropped successfully.");
    } else {
      console.log("Table 'data_schema' still exists.");
    }

    let result = await insertData(db, contents);
    await createSchema(db);
    await createSetup(db);
    db.close();

    return new Response(
      JSON.stringify(
        {
          count: result,
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
  const directoryPath = path.join(process.cwd(), 'db');
  let files = fs.readdirSync(directoryPath);
  const dbFiles = files.filter(file => path.extname(file) === '.db');
  console.log(dbFiles);

  let data = [];

  if (dbFiles.length > 0) {

    try {
      for (const file of dbFiles) {
        const db = new Database(`./db/${file}`, { fileMustExist: true });
        db.pragma('journal_mode = WAL');
        const stmt = db.prepare(`SELECT count(*) as rowCount FROM query_data`);
        let count = stmt.all();
        console.log(count)
        db.close();
        data.push({ file: file.replace(".db", ""), count: count[0].rowCount });
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

  //db.exec(`CREATE TABLE queries (data TEXT);`);
  db.exec(`CREATE TABLE queries (userQuery TEXT, userAnnotation TEXT, dbQuery TEXT, dbResult TEXT);`);

  console.log('created queries')

  db.exec(`CREATE TABLE saved_data (data TEXT);`);
  console.log('created saved_data')
}

const createSchema = async (db) => {

  db.exec(`
      CREATE TABLE data_schema (
        schema TEXT, example TEXT
      );
    `);

  let schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get('query_data');

  console.log('schema:')
  console.log(schema.sql);

  const stmt = db.prepare(`SELECT * FROM query_data`);
  let exampleData = stmt.all();
  console.log('exampleData:')
  console.log(exampleData[0])



  // Insert the text row
  db.prepare('INSERT INTO data_schema (schema, example) VALUES (?, ?)').run([schema.sql, JSON.stringify(exampleData[0])]);

  console.log('created schema')
}

const createTable = async (db, parsedData) => {

  const columnTypes = utils.determineColumnTypes(parsedData);
  let sanitizedHeaders = [];

  const columns = parsedData.meta.fields.map((header, index) => {
    const sanitizedHeader = utils.sanitizeHeader(header, sanitizedHeaders);
    const sqlType = columnTypes[index];
    return `${sanitizedHeader} ${sqlType}`;
  }).join(', ');

  console.log('columns:');
  console.log(columns)
  const createStmt = `CREATE TABLE query_data (${columns})`;
  db.exec(createStmt);
  console.log('tale created')
};

const insertData = async (db, data) => {
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
  await createTable(db, parsedData);

  const placeholders = headers.map(() => '?').join(', ');
  const insertStmt = db.prepare(`INSERT INTO query_data (${headers.join(', ')}) VALUES (${placeholders})`);
  console.log('inserStat');
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
