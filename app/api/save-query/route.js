const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);
const dbName = 'ffai';

export async function POST(request) {
    // You would normally save the data here

    await client.connect();
    const db = client.db(dbName);
    let json = await request.json();
    console.log(json)

    let result = await db.collection('example_queries').insertOne(json, { writeConcern: { w: "majority" } });
    console.log(result)


    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
