import Database from 'better-sqlite3';
const fs = require('fs');
const path = require('path')
const crypto = require('crypto');

function createHash(owner_id, dbName) {
    const hash = crypto.createHash('sha256'); // Using SHA-256 for the hash
    const timestamp = Date.now(); // Current timestamp in milliseconds
    hash.update(owner_id + dbName + timestamp);
    return hash.digest('hex').substring(0, 16); // Limit the hash to the first 16 characters
  }

export const getShared = (shareHash) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/main.db`, {  });
    db.pragma('journal_mode = WAL');

    const stmt = db.prepare(`SELECT * FROM apps WHERE share_hash = ?`);
    
    const info = stmt.all(
        shareHash,       // app_name
    );
    db.close();

    if (info.length > 0) {
        return {user: info[0].owner_id, dbName: info[0].app_name, shared: true}
    }
    return null
} 

export const enableSharing = (user, dbName) => {
    const directoryPath = path.join(process.cwd(), `db/`);
    const db = new Database(`${directoryPath}/main.db`, {  });
    db.pragma('journal_mode = WAL');

    let hash = createHash(user, dbName);

    const stmt = db.prepare(`
      INSERT INTO apps (app_name, owner_id, is_shared, share_hash, shared_with, share_expires_at, status, description, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(app_name, owner_id) 
      DO UPDATE SET 
        is_shared = excluded.is_shared,
        share_hash = excluded.share_hash,
        shared_with = excluded.shared_with,
        share_expires_at = excluded.share_expires_at,
        status = excluded.status,
        description = excluded.description,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    const info = stmt.run(
      dbName,       // app_name
      user,             // owner_id
      1,             // is_shared (1 for true, 0 for false)
      hash,  // share_hash (optional, can be null if not shared)
      'USERS', // shared_with (can be a JSON string or comma-separated values)
      null,  // share_expires_at (optional, can be null)
      'active',      // status (e.g., active, archived)
       null// description (optional)
    );
    db.close();

    console.log(info)

    return hash;
}

