const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const readline = require('readline');

const SOURCE_DIR = 'C:\\Users\\lawri\\Downloads\\nfl';
const DEST_DIR = 'C:\\Users\\lawri\\Downloads\\nfl';

const positions = ['QB', 'RB', 'TE', 'WR'];

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify the question method
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function processFiles(position, weekNumber) {
    console.log(`Processing ${position}...`);

    const sourceFiles = fs.readdirSync(SOURCE_DIR);
    const sourceFile = path.join(SOURCE_DIR, 
        sourceFiles.find(f => f.includes(`Advanced_Stats_Report_${position}`)));
    const destFile = path.join(DEST_DIR, `2024_weekly_${position}.csv`);

    const sourceData = {};
    let destData = [];
    const unmatched = new Set();
    const partialMatches = new Set();
    let headers = [];

    // Read source file
    await new Promise((resolve, reject) => {
        let yaconCount = 0; // Counter for YACON headers
        fs.createReadStream(sourceFile)
            .pipe(csv({
                mapHeaders: ({ header }) => {
                    if (header === 'YACON') {
                        yaconCount++;
                        return position === 'RB' ? 
                            (yaconCount === 1 ? 'ADV_RUSH_YACON' : 'ADV_REC_YACON') : 
                            'ADV_REC_YACON';
                    }
                    return header;
                }
            }))
            .on('data', (row) => {
                const key = `${row.Player}`;
                const transformedRow = {};
                Object.entries(row).forEach(([header, value]) => {
                    if (header !== 'Rank' && header !== 'G') {
                        transformedRow[header.startsWith('ADV_') ? header : `ADV_${header}`] = value;
                    }
                });
                sourceData[key] = transformedRow;
            })
            .on('end', resolve)
            .on('error', reject);
    });

    // Read destination file
    let destHeaders = [];
    const destRows = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(destFile)
            .pipe(csv())
            .on('headers', (headers) => {
                destHeaders = headers;
            })
            .on('data', (row) => {
                destRows.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
    });

    // Process and merge data
    destData = destRows.map(row => {
        if (row.Week === weekNumber.toString()) {
            const playerName = row.Player.split(' (')[0];
            if (sourceData[playerName]) {
                const mergedRow = { ...row, ...sourceData[playerName] };
                delete sourceData[playerName];
                return mergedRow;
            } else {
                const partialMatchKey = Object.keys(sourceData).find(k => 
                    k.startsWith(playerName)
                );
                if (partialMatchKey) {
                    partialMatches.add(row.Player);
                    const mergedRow = { ...row, ...sourceData[partialMatchKey] };
                    delete sourceData[partialMatchKey];
                    return mergedRow;
                }
                unmatched.add(row.Player);
            }
        }
        return row;
    });

    // Get all unique headers
    const allHeaders = Array.from(new Set([
        ...destHeaders,
        ...Object.values(sourceData).flatMap(obj => Object.keys(obj))
    ]));

    // Write the output
    const csvWriter = createCsvWriter({
        path: destFile,
        header: allHeaders.map(header => ({ id: header, title: header }))
    });

    await csvWriter.writeRecords(destData);
    
    console.log(`${position}: ${destData.length} records processed and written to ${destFile}`);
    console.log(`Partial matches: ${partialMatches.size}`);
    console.log(`Partial matched players: ${Array.from(partialMatches).join(', ')}`);
    console.log(`Total unmatched: ${unmatched.size}`);
    console.log(`Unmatched players: ${Array.from(unmatched).join(', ')}`);
}

// Main execution
async function main() {
    try {
        const weekNumber = await askQuestion('Enter the week number to process: ');
        
        // Process each position sequentially
        for (const position of positions) {
            await processFiles(position, weekNumber);
        }
        
        rl.close();
    } catch (error) {
        console.error('Error:', error);
        rl.close();
    }
}

main();
