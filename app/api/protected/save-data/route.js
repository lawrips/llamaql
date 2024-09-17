const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);

export async function POST(request) {
    // You would normally save the data here
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');

    await client.connect();
    const db = client.db(dbName);
    let json = await request.json();
    console.log(json)

    let result = await db.collection('saved_data').insertOne(json, { writeConcern: { w: "majority" } });
    console.log(result)

    
    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
