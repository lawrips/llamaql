export const replacePlaceholders = (content, queries, schema) => {
    content = content.replaceAll('{examples}', JSON.stringify(queries))
    content = content.replaceAll('{schema}', schema);
    content = content.replaceAll('{db}', 'sqlite3');
    content = content.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));

    return content;
}

export const createSchema = (db, tableName) => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema (id INTEGER PRIMARY KEY, name TEXT, schema TEXT, examples TEXT);
      `);
  
    let schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(`data_${tableName}`);
  
    console.log('schema:')
    console.log(schema.sql);
  
    const stmt = db.prepare(`SELECT * FROM data_${tableName}`);
    let exampleData = stmt.all();
    console.log('exampleData (first row):')
    console.log(exampleData[0])
  
    // Insert the text row
    let cleanData = `\nTABLE: data_${tableName}\n`;
    cleanData += Object.keys(exampleData[0]).join(',') + '\n';
    for (let i = 0; i < 5; i++) {
      Object.entries(exampleData[i]).forEach(([key, value]) => {
        cleanData += `${value},`;
      });
      cleanData = cleanData.slice(0,cleanData.length -2);
      cleanData += '\n';
    }
  
    db.prepare('INSERT INTO schema (name, schema, examples) VALUES (?, ?, ?)').run([`data_${tableName}`, schema.sql, cleanData]);
  
    console.log('created schema')
  }
