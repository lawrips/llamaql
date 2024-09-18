import Database from 'better-sqlite3';
const path = require('path');

module.exports = {
    // Function to execute db query
    query: function (username, dbName, query, params, raw) {
            const directoryPath = path.join(process.cwd(), `db/${username}/`);      
    
            const db = new Database(`${directoryPath}${dbName}.db`, {  readonly: true, fileMustExist: true });
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

    run: function (username, dbName, query, params) {
        try {
            const directoryPath = path.join(process.cwd(), `db/${username}/`);      

            const db = new Database(`${directoryPath}${dbName}.db`, { fileMustExist: true });
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