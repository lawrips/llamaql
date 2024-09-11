const { MongoClient } = require('mongodb');

const rag = require('../../../lib/rag/sqlite3/rag');
//const rag = require('../../../lib/rag/mongo/rag');
//const rag = require('../../../lib/rag/graphql/rag');

export async function POST(request) {
  const body = await request.json();
  let input = body.input;
  let instructions = body.instructions;
  let schema = body.schema;
  let requery = body.requery;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');
  const dbName = searchParams.get('app');

  console.log("****** NEW QUERY REQUEST ******** ")

  let result = await rag.query(input, model, instructions, schema, dbName, requery || null);

  if (result.error == null) {
    return new Response(
      JSON.stringify(
        {
          query: result.query,
          data: result.data,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(result.error);
    console.log(result.query);
    return new Response(JSON.stringify({ query: JSON.stringify(result.query), error: JSON.stringify(result.error.toString()) }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }) 
  }
}
