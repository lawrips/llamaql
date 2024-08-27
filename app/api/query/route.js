const { MongoClient } = require('mongodb');

const rag = require('../../../lib/rag/rag');

export async function POST(request) {
  const { input } = await request.json();
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  const result = await rag.query(input, model)
  if (result.err == null) {
    return new Response(
      JSON.stringify(
        {
          query: JSON.stringify(result.query),
          data: JSON.stringify(result.data),
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(query.err);
    return new Response(JSON.stringify({ query: result.query, error: "bad query - the db didnt like the form of that" }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }) 
  }
}
