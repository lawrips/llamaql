const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);

export async function POST(request, { params }) {
    // You would normally save the data here
    const { id } = params;
    let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };


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
