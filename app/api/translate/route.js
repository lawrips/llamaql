const rag = require('../../../lib/rag/mongo/rag');

export async function POST(request) {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
  
    const result = await rag.translate(body.query, body.instructions, body.input, model);
    return new Response(
        JSON.stringify(
        {
            data: `${result}`,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  