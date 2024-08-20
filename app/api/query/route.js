const rag = require('../../../lib/rag/rag');

export async function POST(request) {
    const { input } = await request.json();
    const query = await rag.query(input)
    const result = await rag.translate(query.result);
    return new Response(
        JSON.stringify(
        {
            query: `${JSON.stringify(query.query)}`,
            data: `${result}`,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  