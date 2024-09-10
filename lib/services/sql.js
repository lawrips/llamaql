import Database from 'better-sqlite3';

module.exports = {
    // Function to execute db query
    query: async function (dbName, query, params, raw) {

            const db = new Database(`./data/${dbName}.db`, {});
            db.pragma('journal_mode = WAL');
            const tableName = 'query_data';

            const stmt = db.prepare(query);
            let results = [];

            if (raw) {
                results = stmt.raw().all();
            } else {
                results = stmt.all();
            }
            return results;
    },

    run: async function (dbName, query, params) {
        try {
            const db = new Database(`./data/${dbName}.db`, {});
            db.pragma('journal_mode = WAL');
            let result = db.prepare(query).run(params);

            return result;
        } catch (ex) {
            console.log(ex);
            return null;
        }
    }
}