export async function POST(request) {
    const { input } = await request.json();
    return new Response(JSON.stringify({ result: `Chat result for: ${input}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  