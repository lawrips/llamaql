const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// Function to load draft prices
async function loadDraftPrices(filePath) {
    const draftPrices = {};

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                let position =  data.Position.trim()
                if (position == '') {
                    console.log('empty position!')
                    console.log(data)
                }
                let name = data.Name.replace(/"/g, '').trim();
                let price = parseFloat(data.Price.replace('$', '').trim());

                if (!draftPrices[position]) {
                    draftPrices[position] = {};
                }
                draftPrices[position][name] = price;
            })
            .on('end', () => {
                resolve(draftPrices);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

async function processFile(client, collection, filePath, year, position, draftPrices) {
    const results = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const processedData = {};

                // Normalize and store the player's name from the CSV file
                const playerName = data['Player'].trim();

                // Try to find a matching entry in the draftPrices for the same position
                let draftPrice = 0;
                for (let draftPlayerName in draftPrices[position]) {
                    console.log(draftPlayerName)
                    if (draftPlayerName.startsWith(playerName.replace(/\s*\(.*\)\s*/g, '').trim())) {
                        draftPrice = draftPrices[position][draftPlayerName];

                        break;
                    }
                }

                // Process and clean up the rest of the data
                for (let key in data) {
                    let price = data[key];
                    if (typeof price === 'string') {
                        price = price.replace(/,/g, '');
                        if (!isNaN(price)) {
                            price = price.includes('.') ? parseFloat(price) : parseInt(price);
                        }
                    }
                    processedData[key] = price;
                }

                // Add the draft price and other fields
                processedData.DRAFT_PRICE = draftPrice;
                processedData.season_year = parseInt(year);
                processedData.position = position;

                results.push(processedData);
            })
            .on('end', async () => {
                try {
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
    const uri = 'mongodb://admin:password@localhost:27017';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const collection = client.db('ffai').collection('player_stats');
        await collection.deleteMany();

        const draftPricesFilePath = '../data/draft_price.csv';
        const draftPrices = await loadDraftPrices(draftPricesFilePath);

        const files = fs.readdirSync('../data').filter(file => file.endsWith('.csv'));
        for (const file of files) {
            if (file === 'draft_price.csv') continue; // Skip the draft_price.csv file

            const filePath = path.join('../data', file);
            const match = file.match(/(\d{4})_(\w+)\.csv/);
            if (!match) {
                console.error(`Filename ${file} does not match expected pattern.`);
                continue;
            }

            const year = match[1];
            const position = match[2];
            console.log(position)

            await processFile(client, collection, filePath, year, position, draftPrices);
        }
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
