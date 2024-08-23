const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);
const dbName = 'ffai';

export async function GET(request) {
    // You would normally save the data here

    await client.connect();

    const db = client.db(dbName);

    let result = await db.collection('example_queries').find({}).toArray();
    console.log(result)

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
