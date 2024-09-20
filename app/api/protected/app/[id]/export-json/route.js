import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const utils = require('@/lib/utils/shareUtils');

const exportJson = require('@/tools/createFineTune');

export async function POST(request, {params}) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  if (dbName) {
    let result = await exportJson.exportJson(email, dbName);

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
