import Rag from '@/lib/rag/sqlite3/rag';


export async function POST(request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  if (JSON.stringify(body.input).length > 10000) {
    return new Response(
      JSON.stringify(
        {
          result: [],
          error: `request too large`,
        }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rag = new Rag();
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
