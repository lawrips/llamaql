const csv = require('csv-parser');
const { Readable } = require('stream');
import Database from 'better-sqlite3';
const db = new Database('./data/qgen.db', {});
db.pragma('journal_mode = WAL');
const Papa = require('papaparse')

const tableName = 'query_data';

const sanitizeHeader = (header) => {
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

// Initialize an array to store sanitized headers for uniqueness checks
let sanitizedHeaders = [];
const determineColumnTypes = (parsedData, sampleSize = 100) => {
  const columnTypes = [];
  const numColumns = parsedData.meta.fields.length;

  for (let i = 0; i < numColumns; i++) {
    const columnName = parsedData.meta.fields[i];
    let types = new Set();
    let nonNullCount = 0;
    let dateCount = 0;
    let booleanCount = 0;

    for (let j = 0; j < Math.min(sampleSize, parsedData.data.length); j++) {
      const value = parsedData.data[j][columnName];

      if (value !== null && value !== undefined && value !== '') {
        nonNullCount++;
        const type = typeof value;
        types.add(type);

        // Check for potential date strings
        if (type === 'string' && !isNaN(Date.parse(value))) {
          dateCount++;
        }

        // Check for boolean-like values
        if (type === 'string' && ['true', 'false', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase())) {
          booleanCount++;
        }
      }
    }

    // Determine the column type based on the collected information
    let columnType;
    if (nonNullCount === 0) {
      columnType = 'TEXT'; // Default to TEXT if all values are null/empty
    } else if (types.size === 1) {
      if (types.has('number')) {
        columnType = Number.isInteger(parsedData.data[0][columnName]) ? 'INTEGER' : 'REAL';
      } else if (types.has('boolean')) {
        columnType = 'BOOLEAN';
      } else if (types.has('string')) {
        if (dateCount === nonNullCount) {
          columnType = 'DATE';
        } else if (booleanCount === nonNullCount) {
          columnType = 'BOOLEAN';
        } else {
          columnType = 'TEXT';
        }
      } else {
        columnType = 'TEXT'; // Fallback for unexpected types
      }
    } else {
      // Mixed types
      if (types.has('number') && types.size === 2 && types.has('string')) {
        // Check if strings are valid numbers
        const allValidNumbers = parsedData.data.every(row => {
          const val = row[columnName];
          return (typeof val === 'number') || (typeof val === 'string' && !isNaN(parseFloat(val)));
        });
        columnType = allValidNumbers ? 'REAL' : 'TEXT';
      } else {
        columnType = 'TEXT'; // Fallback for truly mixed types
      }
    }

    columnTypes.push(columnType);
  }

  return columnTypes;
};


const createTable = async (parsedData) => {
  sanitizedHeaders = []; // Reset for each table creation


  const columnTypes = determineColumnTypes(parsedData);

  const columns = parsedData.meta.fields.map((header, index) => {
    const sanitizedHeader = sanitizeHeader(header);
    const sqlType = columnTypes[index];
    return `${sanitizedHeader} ${sqlType}`;
  }).join(', ');

  const createStmt = `CREATE TABLE query_data (${columns})`;
  db.exec(createStmt);
};

const insertData = async (data) => {
  const parsedData = await new Promise((resolve, reject) => {
    Papa.parse(data, {

      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => resolve(result),
      error: (error) => reject(error)
    });
  });


  const headers = parsedData.meta.fields.map(sanitizeHeader);
  console.log(headers)
  console.log(parsedData)
  await createTable(parsedData);

  const placeholders = headers.map(() => '?').join(', ');
  const insertStmt = db.prepare(`INSERT INTO query_data (${headers.join(', ')}) VALUES (${placeholders})`);

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

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');
  const contents = await request.json();


  const tableName = 'query_data';
  const dropTableStmt = `DROP TABLE IF EXISTS ${tableName}`;

  db.exec(dropTableStmt);
  console.log(`Table "${tableName}" has been dropped.`);

  let result = await insertData(contents)

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

export async function GET(request) {
  let rows = [];

  try {
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