const Database = require( 'better-sqlite3' );

const db = new Database(`./data/strength.db`, {});
db.pragma('journal_mode = WAL');
const tableName = '';


let result = db.prepare("DELETE FROM query_data WHERE Set_Order = 'Note'").run();

setTimeout(() => {
    console.log(result);
}, 1000);
