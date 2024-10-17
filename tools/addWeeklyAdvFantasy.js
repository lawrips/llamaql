const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

// Define the data directory
const DATA_DIR = 'C:\\Users\\lawri\\Downloads\\nfl'; // Keep this as it was

// Define the positions to process
const positions = ['QB', 'RB', 'TE', 'WR'];

// Log the data directory and files
console.log('Data directory:', DATA_DIR);
console.log('All files in directory:', fs.readdirSync(DATA_DIR));

/**
 * Processes a single position's CSV files.
 * @param {string} position - The position to process (e.g., 'RB', 'WR').
 */
async function processPosition(position) {
    // Filter and sort files for the given position
    const files = fs.readdirSync(DATA_DIR).filter(file => 
        file.startsWith(`FantasyPros_Fantasy_Football_Advanced_Stats_Report_${position}`) && 
        file.endsWith('.csv')
    ).sort((a, b) => {
        const weekA = parseInt(a.match(/_(\d+)\.csv$/)[1]);
        const weekB = parseInt(b.match(/_(\d+)\.csv$/)[1]);
        return weekA - weekB;
    });

    console.log(`Files found for ${position}:`, files);

    if (files.length === 0) {
        console.log(`No files found for position ${position}. Skipping.`);
        return;
    }

    let allRows = [];

    // Process each file sequentially
    for (const file of files) {
        console.log(`Processing file: ${file}`);
        const weekMatch = file.match(/_(\d+)\.csv$/);
        const week = weekMatch ? parseInt(weekMatch[1]) : 1;

        const rows = await new Promise((resolve, reject) => {
            const fileRows = [];
            let headers = [];
            let yaconCount = 0; // Reset YACON counter for each file

            fs.createReadStream(path.join(DATA_DIR, file))
                .pipe(csv({
                    mapHeaders: ({ header }) => {
                        if (position === 'RB' && header === 'YACON') {
                            yaconCount++;
                            return yaconCount === 1 ? 'RUSH_YACON' : 'REC_YACON';
                        } else if ((position === 'WR' || position === 'TE') && header === 'YACON') {
                            return 'REC_YACON';
                        }
                        return header;
                    }
                }))
                .on('headers', (headerRow) => {
                    // Exclude 'Rank' and ensure 'G' is handled separately
                    headers = headerRow.filter(h => h !== 'Rank' && h !== 'G');
                })
                .on('data', (row) => {
                    // Check if the row is not entirely empty
                    if (Object.values(row).some(value => value.trim() !== '')) {
                        const updatedRow = { G: week }; // Initialize with week number

                        headers.forEach(header => {
                            updatedRow[header] = row[header];
                        });

                        // Parse numeric values except for 'Player'
                        Object.keys(updatedRow).forEach(key => {
                            if (key !== 'Player' && key !== 'G') {
                                updatedRow[key] = isNaN(parseFloat(updatedRow[key])) ? updatedRow[key] : parseFloat(updatedRow[key]);
                            }
                        });

                        fileRows.push(updatedRow);

                        // Log specific player data if needed
                        if (updatedRow.Player === 'Dameon Pierce (HOU)') {
                            console.log(`Processing Dameon Pierce data for week ${week}:`, updatedRow);
                        }
                    }
                })
                .on('end', () => resolve(fileRows))
                .on('error', (error) => reject(error));
        });

        allRows = allRows.concat(rows);
    }

    // Define the headers for the output CSV
    let outputHeaders = ['G', 'Player'];

    // Determine additional headers dynamically based on the first row
    if (allRows.length > 0) {
        const sampleRow = allRows[0];
        Object.keys(sampleRow).forEach(key => {
            if (key !== 'G' && key !== 'Player') {
                outputHeaders.push(key);
            }
        });
    }

    // Create the CSV stringifier with the correct headers
    const csvStringifier = createCsvStringifier({
        header: outputHeaders.map(header => ({ id: header, title: header }))
    });

    // Define the output path
    const outputPath = path.join(DATA_DIR, `adv_2024_weekly_${position}.csv`);

    // Write headers and records to the output file
    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(allRows);
    fs.writeFileSync(outputPath, headerString + recordsString);

    console.log(`Processed ${position}: ${allRows.length} rows written to ${outputPath}`);
}

/**
 * Main function to process all positions.
 */
async function main() {
    for (const position of positions) {
        await processPosition(position);
    }
    console.log('All positions processed successfully.');
}

// Execute the main function and handle errors
main().catch(console.error);
