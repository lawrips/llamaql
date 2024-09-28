import Database from 'better-sqlite3';
const fs = require('fs');
const path = require('path')


export const deleteAll = (dbName, user) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');


    let stmt = db.prepare(`
        CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT,    
        owner_id INTEGER NOT NULL,
        db_query TEXT,
        db_result TEXT,
        user_chat TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`)

    stmt.run();

    stmt = db.prepare(`DELETE FROM conversations WHERE owner_id = ?;`)

    let info = stmt.run(user);

    console.log(info);

    db.close();

}

export const getAll = (dbName, user) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    const stmt = db.prepare(`SELECT db_query AS dbQuery, db_result AS dbResult, user_chat AS userChat FROM conversations WHERE owner_id = ?`);

    const info = stmt.all(
        user,       // app_name
    );
    db.close();

    if (info.length > 0) {
        return info;
    }
    return []
}

export const insert = (dbName, user, dbQuery, dbResult, userChat) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    let stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,    
    owner_id INTEGER NOT NULL,
    db_query TEXT,
    db_result TEXT,
    user_chat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`)

    stmt.run();


    stmt = db.prepare(`
      INSERT INTO conversations (conversation_id, owner_id, db_query, db_result, user_chat, created_at, updated_at) 
      VALUES ('', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log(user, dbQuery, JSON.stringify(dbResult), userChat);


    const info = stmt.run(
        user,             // owner_id
        dbQuery,
        JSON.stringify(dbResult),
        userChat
    );
    db.close();

    console.log(info);
}

