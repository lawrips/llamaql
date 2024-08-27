import instructions from '@/lib/constants/instructions';

const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);
const dbName = 'qgen';

export async function GET(request) {
    // You would normally save the data here

    await client.connect();

    const db = client.db(dbName);

    let exampleQueries = await db.collection('example_queries').find({}).toArray();
    let dataSchema = await db.collection('data_schema').find({}).toArray();
    let instructions = await db.collection('instructions').find({}).toArray();

    return new Response(JSON.stringify(
        {
            exampleQueries: exampleQueries,
            dataSchema: dataSchema,
            instructions: instructions
        }
    ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
