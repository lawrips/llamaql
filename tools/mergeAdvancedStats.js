const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const SOURCE_DIR = 'C:\\Users\\lawri\\Downloads\\nfl';
const DEST_DIR = 'C:\\Users\\lawri\\Downloads\\nfl';

const positions = ['QB', 'RB', 'TE', 'WR'];

function processFiles(position) {
    console.log(`Processing ${position}...`);

    const sourceFile = path.join(SOURCE_DIR, `adv_2024_weekly_${position}.csv`);
    const destFile = path.join(DEST_DIR, `2024_weekly_${position}.csv`);

    const sourceData = {};
    let destData = [];
    const unmatched = new Set();
    const partialMatches = new Set();

    // Read source file
    fs.createReadStream(sourceFile)
        .pipe(csv())
        .on('data', (row) => {
            const key = `${row.Player}_${row.G}`;
            sourceData[key] = Object.entries(row).reduce((acc, [key, value]) => {
                if (key !== 'Player' && key !== 'G') {
                    acc[`ADV_${key}`] = value;
                }
                return acc;
            }, {});
        })
        .on('end', () => {
            // Read destination file
            let headers = [];
            let rostIndex = -1;
            fs.createReadStream(destFile)
                .pipe(csv())
                .on('headers', (headerRow) => {
                    headers = headerRow;
                    rostIndex = headers.indexOf('ROST');
                })
                .on('data', (row) => {
                    // Only process rows up to the ROST column
                    const processedRow = {};
                    for (let i = 0; i <= rostIndex; i++) {
                        processedRow[headers[i]] = row[headers[i]];
                    }

                    const key = `${processedRow.Player}_${processedRow.Week}`;
                    if (sourceData[key]) {
                        destData.push({ ...processedRow, ...sourceData[key] });
                        delete sourceData[key];
                    } else {
                        // Try partial match on player name without team
                        const playerName = processedRow.Player.split(' (')[0];
                        const partialMatchKey = Object.keys(sourceData).find(k => 
                            k.startsWith(playerName) && k.endsWith(`_${processedRow.Week}`)
                        );
                        if (partialMatchKey) {
                            destData.push({ ...processedRow, ...sourceData[partialMatchKey] });
                            partialMatches.add(processedRow.Player);
                            delete sourceData[partialMatchKey];
                        } else {
                            destData.push(processedRow);
                        }
                    }
                })
                .on('end', () => {
                    // Remaining entries in sourceData are unmatched
                    Object.keys(sourceData).forEach(key => unmatched.add(key.split('_')[0]));

                    // Write output file (overwrite the original weekly file)
                    let outputHeaders = headers.slice(0, rostIndex + 1);
                    if (Object.keys(sourceData).length > 0) {
                        outputHeaders = [
                            ...outputHeaders,
                            ...Object.keys(sourceData[Object.keys(sourceData)[0]])
                                .filter(header => header !== 'ADV_Player' && header !== 'ADV_G')
                        ];
                    }

                    const csvWriter = createCsvWriter({
                        path: destFile,
                        header: outputHeaders.map(header => ({ id: header, title: header }))
                    });

                    csvWriter.writeRecords(destData)
                        .then(() => {
                            console.log(`${position}: ${destData.length} players processed and written to ${destFile}`);
                            console.log(`Partial matches: ${partialMatches.size}`);
                            console.log(`Partial matched players: ${Array.from(partialMatches).join(', ')}`);
                            console.log(`Total unmatched: ${unmatched.size}`);
                            console.log(`Unmatched players: ${Array.from(unmatched).join(', ')}`);
                        });
                });
        });
}

// Main execution
positions.forEach(processFiles);
