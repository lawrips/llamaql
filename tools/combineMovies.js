const fs = require('fs');
const csv = require('csv-parser');
const Database = require('better-sqlite3');
const through2 = require('through2');

// Paths to the CSV files
const tmdbFile = 'c:\\users\\lawri\\Downloads\\TMDB_all_movies.csv';
const netflixFile = 'c:\\users\\lawri\\Downloads\\netflix_titles.csv';
const outputFile = 'c:\\users\\lawri\\Downloads\\merged_output.csv';
const dbFile = 'c:\\users\\lawri\\Downloads\\tmdb_movies.db';



// Counters
let totalRecords = 0;
let matchedRecords = 0;

// Create or open the SQLite database using better-sqlite3
let db = new Database(dbFile);

// Function to create the database and table
function createDatabase(callback) {
    try {
        // Create table
        db.exec(`CREATE TABLE IF NOT EXISTS tmdb_movies (
            id INTEGER,
            title TEXT,
            vote_average REAL,
            vote_count INTEGER,
            status TEXT,
            release_date TEXT,
            revenue REAL,
            runtime REAL,
            budget REAL,
            imdb_id TEXT,
            original_language TEXT,
            original_title TEXT,
            overview TEXT,
            popularity REAL,
            tagline TEXT,
            genres TEXT,
            production_companies TEXT,
            production_countries TEXT,
            spoken_languages TEXT,
            cast TEXT,
            director TEXT,
            director_of_photography TEXT,
            writers TEXT,
            producers TEXT,
            music_composer TEXT,
            imdb_rating REAL,
            imdb_votes INTEGER
        )`);
        // Create index on title
        db.exec(`CREATE INDEX IF NOT EXISTS idx_title ON tmdb_movies(title)`);
        callback();
    } catch (err) {
        console.error('Error creating table or index:', err.message);
        process.exit(1);
    }
}

// Function to populate the database from the TMDB CSV file
function populateDatabase(callback) {
    console.log('Populating database from TMDB CSV file...');
    let insertStmt = db.prepare(`INSERT INTO tmdb_movies VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    let insert = db.transaction((rows) => {
        for (const row of rows) {
            insertStmt.run(row);
        }
    });

    let rowsBuffer = [];
    let bufferLimit = 1000; // Adjust this number based on your system's memory capacity

    let tmdbStream = fs.createReadStream(tmdbFile)
        .pipe(csv({
            separator: ',',
            headers: [
                "id", "title", "vote_average", "vote_count", "status", "release_date", "revenue", "runtime", "budget",
                "imdb_id", "original_language", "original_title", "overview", "popularity", "tagline", "genres",
                "production_companies", "production_countries", "spoken_languages", "cast", "director",
                "director_of_photography", "writers", "producers", "music_composer", "imdb_rating", "imdb_votes"
            ],
            skipLines: 1 // skip header line
        }));

    tmdbStream.on('data', (row) => {
        // Collect rows in a buffer to insert in batches
        let data = [
            row.id, row.title, row.vote_average, row.vote_count, row.status, row.release_date, row.revenue, row.runtime,
            row.budget, row.imdb_id, row.original_language, row.original_title, row.overview, row.popularity, row.tagline,
            row.genres, row.production_companies, row.production_countries, row.spoken_languages, row.cast, row.director,
            row.director_of_photography, row.writers, row.producers, row.music_composer, row.imdb_rating, row.imdb_votes
        ];
        rowsBuffer.push(data);

        if (rowsBuffer.length >= bufferLimit) {
            insert(rowsBuffer);
            rowsBuffer = [];
        }
    });

    tmdbStream.on('end', () => {
        if (rowsBuffer.length > 0) {
            insert(rowsBuffer);
        }
        console.log('Database population completed.');
        callback();
    });

    tmdbStream.on('error', (err) => {
        console.error('Error reading TMDB CSV file:', err.message);
        process.exit(1);
    });
}

// Function to process the Netflix CSV file and merge data
function processNetflixTitles() {
    console.log('Processing Netflix titles...');
    let output = fs.createWriteStream(outputFile, { flags: 'a' }); // Append mode
    let headersWritten = false;

    let netflixStream = fs.createReadStream(netflixFile)
        .pipe(csv({
            separator: ',',
            skipLines: 0
        }))
        .pipe(through2.obj(function (netflixRow, enc, callback) {
            totalRecords++;
            let title = netflixRow.title;

            // Query the database for matching title
            let tmdbRow = db.prepare(`SELECT * FROM tmdb_movies WHERE title = ? COLLATE NOCASE`).get(title);

            // Merge data
            let mergedRow = Object.assign({}, netflixRow);
            if (tmdbRow) {
                matchedRecords++;
                // Add TMDB data to mergedRow
                for (let key in tmdbRow) {
                    if (!(key in mergedRow)) {
                        mergedRow[key] = tmdbRow[key];
                    }
                }
            }

            // Write headers if not yet written
            if (!headersWritten) {
                let headers = Object.keys(mergedRow);
                output.write(headers.join(',') + '\n');
                headersWritten = true;
            }

            // Write merged data to output file
            let values = Object.values(mergedRow).map(value => {
                if (typeof value === 'string') {
                    // Escape double quotes and wrap the value in quotes
                    return `"${value.replace(/"/g, '""')}"`;
                } else if (value === null || value === undefined) {
                    return '';
                } else {
                    return value;
                }
            });
            output.write(values.join(',') + '\n');
            console.log(`${totalRecords}: processed ${title} (${matchedRecords} matched)`)

            // Proceed to next row
            callback();
        }));

    netflixStream.on('finish', () => {
        console.log('Processing completed.');
        console.log(`Total records processed: ${totalRecords}`);
        console.log(`Successfully matched records: ${matchedRecords}`);
        // Close the database
        db.close();
        output.end();
    });

    netflixStream.on('error', (err) => {
        console.error('Error processing Netflix titles:', err.message);
        process.exit(1);
    });
}

// Main execution flow
//createDatabase(() => {
//    populateDatabase(() => {
        processNetflixTitles();
//    });
//});
