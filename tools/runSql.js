const Database = require( 'better-sqlite3' );

const db = new Database(`./data/strength.db`, {});
db.pragma('journal_mode = WAL');
const tableName = '';


let result = db.prepare("SELECT * FROM queries").all();

setTimeout(() => {
    console.log(result);
}, 1000);
