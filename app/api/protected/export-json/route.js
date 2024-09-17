import { NextResponse } from 'next/server';

const exportJson = require('@/tools/createFineTune');

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');

  if (dbName) {
    let result = await exportJson.exportJson(dbName);

    // Create the response headers to trigger download
    const headers = new Headers({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${dbName}.jsonl"`,
    });

    return new NextResponse(result, { headers });
  }
  else {
    return new Response(JSON.stringify(null), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

  }
}
