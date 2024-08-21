const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

async function processFile(client, collection, filePath, year, position) {
    const results = [];

    return new Promise((resolve, reject) => {
        const results = [];
        let isFirstRow = true;
        let passingColumns, rushingColumns;
        const headersModified = position === 'QB';
        let count = 0;
        fs.createReadStream(filePath)
        .pipe(csv())

            .on('data', (data) => {
                if (count == 0) console.log()
                    count++;
                const processedData = {};

                for (let key in data) {
                    let value = data[key];
                    // Remove commas and convert to number if possible
                    if (typeof value === 'string') {
                        value = value.replace(/,/g, '');
                        if (!isNaN(value)) {
                            value = value.includes('.') ? parseFloat(value) : parseInt(value);
                        }
                    }
                    processedData[key] = value;
                }


                // Add season_year and position fields to each record
                processedData.season_year = parseInt(year);
                processedData.position = position;

                results.push(processedData);
            })
            .on('end', async () => {
                try {
                    // Insert the data into the MongoDB collection
                    if (results.length > 0) {
                        const insertResult = await collection.insertMany(results);
                        console.log(`${insertResult.insertedCount} records inserted from file ${filePath}.`);
                    }
                    resolve();
                } catch (err) {
                    console.error(`Error inserting data from file ${filePath}:`, err);
                    reject(err);
                }
            })
            .on('error', (err) => {
                console.error(`Error processing file ${filePath}:`, err);
                reject(err);
            });
    });
}

async function main() {
    // MongoDB connection URL
    const uri = 'mongodb://admin:password@localhost:27017';

    // MongoDB client
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to MongoDB
        await client.connect();
        const collection = client.db('ffai').collection('player_stats');
        await collection.deleteMany();

        // Read all files in the /data directory
        const files = fs.readdirSync('./data').filter(file => file.endsWith('.csv'));
        for (const file of files) {
            const filePath = path.join('./data', file);
        
            // Extract the year and position from the filename
            const match = file.match(/(\d{4})_(\w+)\.csv/);
            if (!match) {
                console.error(`Filename ${file} does not match expected pattern.`);
                continue;
            }
        
            const year = match[1];
            const position = match[2];

            await processFile(client, collection, filePath, year, position);
        }
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        // Ensure MongoDB connection is closed after all operations
        await client.close();
    }
}

// Execute the main function
main().catch(console.error);
