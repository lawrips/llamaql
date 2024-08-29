const { MongoClient } = require('mongodb');
// MongoDB connection URL and Database Name
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);

module.exports = {
    // Function to execute MongoDB query
    executeMongoDBQuery: async function (query, dbName) {
        await client.connect();      
        const db = client.db(dbName);
        const collection = db.collection('query_data');
        
        console.log(collection)
        console.log(dbName);
        let all_results = await collection.find({}).toArray();


        let results;

        if (Array.isArray(query)) {
            results = (await collection.aggregate(query).toArray());
        } else if (typeof query === 'object') {
            results = await collection.find(query).toArray();
        } else {
            throw new Error('Invalid query format');
        }

        await client.close();
        return results;
    },

    getExampleQueries: async function(dbName) {

        await client.connect();
        const db = client.db(dbName);
        const colection = db.collection('example_queries');
        let exampleQueries = await colection.find({}).toArray();
        
        return exampleQueries;
    }
}