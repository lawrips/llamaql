const csv = require('csv-parser');
const { Readable } = require('stream');
import Database from 'better-sqlite3';
const Papa = require('papaparse')

const instructions = require('../../../lib/constants/instructions')

const tableName = 'query_data';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');
  const contents = await request.json();

  if (dbName) {
    const db = new Database(`./data/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    db.exec(`DROP TABLE IF EXISTS query_data`);
    db.exec(`DROP TABLE IF EXISTS data_schema`);
    db.exec(`DROP TABLE IF EXISTS example_queries`);
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
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');

  let rows = [];

  if (dbName) {

    try {
      const db = new Database(`./data/${dbName}.db`, {});
      db.pragma('journal_mode = WAL');

      const stmt = db.prepare(`SELECT * FROM ${tableName}`);
      rows = stmt.all();
      console.log("rows: " + rows.length);
      console.log(rows.slice(rows.length - 7, rows.length - 6))
    } catch (ex) {
      console.log(ex);
    }
    return new Response(
      JSON.stringify(
        {
          data: rows,
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


const sanitizeHeader = (header, sanitizedHeaders) => {

  // 1. Replace spaces and special characters with underscores
  let sanitized = header.trim().replace(/[\s\W]+/g, '_'); // Replace multiple spaces/special chars with one _

  // 2. Remove leading/trailing underscores 
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // 3. Handle cases where sanitization results in an empty string or a number
  if (!sanitized || !isNaN(sanitized)) {
    sanitized = `column_${header.substring(0, 10)}`; // Use a prefix and part of the original header
  }

  // 4. Ensure uniqueness (optional, but recommended)
  // Keep track of used sanitized headers to prevent duplicates
  if (sanitizedHeaders.includes(sanitized)) {
    let counter = 1;
    while (sanitizedHeaders.includes(`${sanitized}_${counter}`)) {
      counter++;
    }
    sanitized = `${sanitized}_${counter}`;
  }
  sanitizedHeaders.push(sanitized);

  // 5. Remove trailing underscores (if any) 
  sanitized = sanitized.replace(/_+$/g, '');

  return sanitized;
};

const determineColumnTypes = (parsedData, sampleSize = 100) => {
  const isDate = (value) => {
    // Strict date format check: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
    const dateRegex = /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/;
    if (!dateRegex.test(value)) return false;
    
    // Additional check to ensure it's a valid date
    const date = new Date(value);
    return !isNaN(date.getTime());
  };

  const isBooleanLike = (value) => ['true', 'false', 'yes', 'no', 'on', 'off'].includes(String(value).toLowerCase());
  
  const isNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value);

  return parsedData.meta.fields.map(columnName => {
    const sample = parsedData.data.slice(0, sampleSize);
    const values = sample.map(row => row[columnName]).filter(v => v != null && v !== '');

    if (values.length === 0) return 'TEXT';

    // Check if all values are valid dates and the column name suggests it's a date
    const allDates = values.every(isDate);
    if (allDates && ['date', 'datetime'].some(term => columnName.toLowerCase().includes(term))) {
      return 'DATE';
    }

    const allBooleans = values.every(isBooleanLike);
    if (allBooleans) return 'BOOLEAN';

    const allNumbers = values.every(isNumber);
    if (allNumbers) {
      const allIntegers = values.every(v => Number.isInteger(parseFloat(v)));
      return allIntegers ? 'INTEGER' : 'REAL';
    }

    return 'TEXT';
  });
};

const createSetup = async (db) => {

  db.exec(`CREATE TABLE instructions (data TEXT);`);
  db.prepare('INSERT INTO instructions (data) VALUES (?)').run([instructions.instructions[0]]);
  db.prepare('INSERT INTO instructions (data) VALUES (?)').run([instructions.instructions[1]]);
  console.log('created instructions')

  db.exec(`CREATE TABLE example_queries (data TEXT);`);
  console.log('created example_queries')

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

  const columnTypes = determineColumnTypes(parsedData);
  let sanitizedHeaders = [];

  const columns = parsedData.meta.fields.map((header, index) => {
    const sanitizedHeader = sanitizeHeader(header, sanitizedHeaders);
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
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => resolve(result),
      error: (error) => reject(error)
    });
  });


  console.log('about to sanitize headers')
  let sanitizedHeaders = [];
  const headers = parsedData.meta.fields.map(header => sanitizeHeader(header, sanitizedHeaders));
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
