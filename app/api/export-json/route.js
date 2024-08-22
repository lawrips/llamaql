const { MongoClient } = require('mongodb');

const exportJson = require('../../../tools/createFineTune');

export async function POST(request) {
  exportJson.exportJson();

  return new Response(
      JSON.stringify(
        {
          status: 'ok'
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  
}
