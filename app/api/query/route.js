const { MongoClient } = require('mongodb');

const rag = require('../../../lib/rag/rag');

export async function POST(request) {
    const { input } = await request.json();
    const query = await rag.query(input)
    return new Response(
        JSON.stringify(
        {
            query: JSON.stringify(query.query),
            data: JSON.stringify(query.data),
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  