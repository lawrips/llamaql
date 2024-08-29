const { MongoClient } = require('mongodb');

const exportJson = require('../../../tools/createFineTune');

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');

  exportJson.exportJson(dbName);

  return new Response(
      JSON.stringify(
        {
          status: 'ok'
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  
}
