import instructions from '@/lib/constants/instructions';

const { MongoClient } = require('mongodb');
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);


export async function GET(request) {
    // You would normally save the data here
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');

    await client.connect();
    const db = client.db(dbName);
    


    let exampleQueries = await db.collection('example_queries').find({}).toArray();
    let dataSchema = await db.collection('data_schema').find({}).toArray();
    let instructions = await db.collection('instructions').find({}).toArray();
    let savedData = await db.collection('saved_data').find({}).toArray();

    exampleQueries.forEach((item) => {
        let result = savedData.filter(i => i.query == item.messages[0].content);
        if (result.length == 1) {
            item.savedData = result[0].data;
        }
    })

    console.log(exampleQueries);

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
