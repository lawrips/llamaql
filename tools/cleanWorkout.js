const Database = require( 'better-sqlite3' );

const db = new Database(`./db/lawrence.ripsher@gmail.com/strength.db`, {fileMustExist: true});
db.pragma('journal_mode = WAL');

let result = db.prepare(`SELECT * FROM sqlite_master WHERE type = 'table' AND name like ?`).get(`data_%`);
console.log('tables:')
console.log(result.name)


result = db.prepare(`DELETE FROM ${result.name} WHERE Set_Order = 'Note'`).run();
db.close();

setTimeout(() => {
    console.log(result);
}, 1000);
