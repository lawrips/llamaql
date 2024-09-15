import Database from 'better-sqlite3';

module.exports = {
    // Function to execute db query
    query: function (dbName, query, params, raw) {

            const db = new Database(`./db/${dbName}.db`, {  readonly: true, fileMustExist: true });
            db.pragma('journal_mode = WAL');

            const stmt = db.prepare(query);
            let results = [];

            if (raw) {
                results = stmt.raw().all();
            } else {
                results = stmt.all();
            }
            db.close();

            return results;
    },

    run: function (dbName, query, params) {
        try {
            const db = new Database(`./db/${dbName}.db`, {fileMustExist: true});
            db.pragma('journal_mode = WAL');
            let result = db.prepare(query).run(params);
            db.close();

            return result;
        } catch (ex) {
            console.log(ex);
            return null;
        }
    }
}