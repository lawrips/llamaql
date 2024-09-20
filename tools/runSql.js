const Database = require('better-sqlite3');
const readline = require('readline');

const command = `
CREATE TABLE apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    is_shared BOOLEAN NOT NULL CHECK (is_shared IN (0, 1)),
    share_hash TEXT,
    shared_with TEXT,
    share_expires_at DATETIME,
    status TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_name, owner_id)
);
`

// Initialize the database connection
const db = new Database(`./db/main.db`, { fileMustExist: false });
db.pragma('journal_mode = WAL');

if (command) {
    // Prepare and execute the SQL query provided by the user
    let result = db.prepare(command).run();

    // Output the result
    console.log(result);
    process.exit(0);
}
// Create a readline interface to capture input from the command line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask the user for an SQL query
rl.question('Please enter an SQL query: ', (sqlQuery) => {
    try {
        // Prepare and execute the SQL query provided by the user
        let result = db.prepare(sqlQuery).run();

        // Output the result
        console.log(result);
    } catch (error) {
        console.error("Error executing query:", error.message);
    }

    // Close the readline interface
    rl.close();
});


