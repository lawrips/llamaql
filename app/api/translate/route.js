const rag = require('../../../lib/rag/rag');

export async function POST(request) {
    const { input } = await request.json();
    const result = await rag.translate(input);
    return new Response(
        JSON.stringify(
        {
            data: `${result}`,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  