import Database from 'better-sqlite3';

module.exports = {
    // Function to execute db query
    execute: async function (query, dbName) {
        const db = new Database(`./data/${dbName}.db`, {});
        db.pragma('journal_mode = WAL');
        const tableName = 'query_data';


        const stmt = db.prepare(query);
        let results = stmt.all();

        return results;
    },

    getAll: async function (dbName, tableName, raw) {
        try {
            const db = new Database(`./data/${dbName}.db`, {});
            db.pragma('journal_mode = WAL');

            const stmt = db.prepare(`SELECT * FROM ${tableName}`);
            let results = [];
            if (raw) {
                results = stmt.raw().all();
            } else {
                results = stmt.all();
            }
            return results;
        } catch (ex) {
            console.log(ex);
            return [];
        }
    }
}