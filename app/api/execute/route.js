const { MongoClient } = require('mongodb');

const rag = require('../../../lib/rag/rag');
const mongo = require('../../../lib/services/mongo')

export async function POST(request) {
  const { input } = await request.json();
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');

  
  const result = await mongo.executeMongoDBQuery(JSON.parse(input), dbName);
  if (result.err == null) {
    return new Response(
      JSON.stringify(
        {
          query: input,
          data: JSON.stringify(result),
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(query.err);
    return new Response(JSON.stringify({ query: query.query, error: "bad query - the db didnt like the form of that" }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }) 
  }
}
