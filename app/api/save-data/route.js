export async function POST(request) {
    // You would normally save the data here
    return new Response(JSON.stringify({ message: 'Chat result saved' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  