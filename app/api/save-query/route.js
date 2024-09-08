import Database from 'better-sqlite3';

export async function POST(request) {
    // You would normally save the data here
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');

    let json = await request.json();
    console.log(json)

    const db = new Database(`./data/${dbName}.db`, {});
    db.pragma('journal_mode = WAL');


    let result = db.prepare('INSERT INTO example_queries (data) VALUES (?)').run(JSON.stringify(json));

    console.log(result)

    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

/*const { MongoClient } = require('mongodb');
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

    let result = await db.collection('example_queries').insertOne(json, { writeConcern: { w: "majority" } });
    console.log(result)


    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
*/