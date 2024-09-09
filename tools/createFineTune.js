const { MongoClient } = require('mongodb');
const { instructions } = require('../lib/constants/instructions');
const fs = require('fs');
const filePath = './data/finetuneoutput.jsonl';


module.exports = {
    exportJson: async function (dbName) {
        const url = 'mongodb://admin:password@localhost:27017';
        const collectionName = 'queries'; // Collection name

        // Create a new MongoClient
        const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        let json = '';

        try {
            // Connect to the MongoDB server
            await client.connect();

            const db = client.db(dbName);
            const collection = db.collection(collectionName);

            // Query all documents
            const documents = await collection.find({}).toArray();

            // Convert each document to JSONL format
            documents.forEach(doc => {
                // Escape double quotes inside JSON content
                doc.messages.unshift({ "role": "system", "content": instructions });
                const escapedContent = JSON.stringify(doc.messages).replaceAll("\\n", "")//.replace(/"/g, '\\"');

                // Format JSONL output
                let jsonlLine = `{"messages": ${escapedContent}}`;

                // Print JSONL line
                json = json + jsonlLine + '\n';
            });
        } catch (err) {
            console.error('Error connecting to the database', err);
        } finally {
            // Close the connection
            await client.close();
            console.log(json);

            fs.writeFile(filePath, json, (err) => {
                if (err) {
                  console.error('Error writing to file:', err);
                } else {
                  console.log('File written successfully!');
                }
              });

            return json;
        }
    }
}

module.exports.exportJson().catch(console.error);
