const Database = require('better-sqlite3');
const readline = require('readline');

// Initialize the database connection
const db = new Database(`./db/imdb.db`, {fileMustExist: true});
db.pragma('journal_mode = WAL');

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
