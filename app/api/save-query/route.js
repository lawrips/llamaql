import Database from 'better-sqlite3';
const db = require('../../../lib/services/sql');

export async function POST(request) {
    // You would normally save the data here
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');

    let json = await request.json();
    console.log(json);

    let result = db.run(dbName, 'INSERT INTO queries (userQuery, userAnnotation, dbQuery, dbResult) VALUES (?, ?, ?, ?)', [json.userQuery, json.userAnnotation, json.dbQuery, json.dbResult]);
    console.log(result.changes)
//    result = db.run(dbName, 'INSERT INTO saved_data (data) VALUES (?)', JSON.stringify(json));


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

    let result = await db.collection('queries').insertOne(json, { writeConcern: { w: "majority" } });
    console.log(result)


    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
*/