const { MongoClient } = require('mongodb');
const { instructions } = require('../lib/constants/instructions');

async function queryMongo() {
    const url = 'mongodb://admin:password@localhost:27017';
    const dbName = 'ffai'; // Database name
    const collectionName = 'example_queries'; // Collection name

    // Create a new MongoClient
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

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
            doc.messages.unshift({"role": "system", "content": instructions});
            const escapedContent = JSON.stringify(doc.messages).replaceAll("\\n","")//.replace(/"/g, '\\"');

            // Format JSONL output
            const jsonlLine = `{"messages": ${escapedContent}}`;

            // Print JSONL line
            console.log(jsonlLine);
        });
    } catch (err) {
        console.error('Error connecting to the database', err);
    } finally {
        // Close the connection
        await client.close();
    }
}

queryMongo().catch(console.error);
