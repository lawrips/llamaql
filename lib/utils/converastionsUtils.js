import Database from 'better-sqlite3';
const fs = require('fs');
const path = require('path')

let createStmt = `
    CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,    
    owner_id INTEGER NOT NULL,
    db_query TEXT,
    db_result TEXT,
    user_chat TEXT,
    chat_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`

export const deleteAll = (dbName, user) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    db.prepare(createStmt).run();

    let stmt = db.prepare(`DELETE FROM conversations WHERE owner_id = ?;`)

    let info = stmt.run(user);

    console.log(info);

    db.close();

}

export const getAll = (dbName, user) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    db.prepare(createStmt).run();

    const stmt = db.prepare(`SELECT db_query AS dbQuery, db_result AS dbResult, user_chat AS userChat, chat_result AS chatResult FROM conversations WHERE owner_id = ?`);

    const info = stmt.all(
        user,       // app_name
    );
    db.close();

    if (info.length > 0) {
        return info;
    }
    return []
}

export const add = (dbName, user, dbQuery, dbResult, userChat, chatResult) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');

    db.prepare(createStmt).run();

    let stmt = db.prepare(`
      INSERT INTO conversations (conversation_id, owner_id, db_query, db_result, user_chat, chat_result, created_at, updated_at) 
      VALUES ('', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log(user, dbQuery, JSON.stringify(dbResult), userChat, chatResult);

    const info = stmt.run(
        user,             // owner_id
        dbQuery,
        JSON.stringify(dbResult),
        userChat,
        chatResult
    );
    db.close();

    console.log(info);
}

