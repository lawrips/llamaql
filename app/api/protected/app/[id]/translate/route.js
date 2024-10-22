import Rag from '@/lib/rag/sqlite3/rag';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createStreamResponse } from '@/lib/utils/streamUtils';
const utils = require('@/lib/utils/shareUtils');
// Add this import
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');
  const { id } = params;

  const maxLength = 10000;

  console.log("****** NEW TRANSLATE REQUEST ********");
  console.log('body size: ' + body.input[0]?.length);
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };
  const rag = new Rag(email, dbName);

  // Check if body.input exceeds rag.maxTokens
  if (body.input && JSON.stringify(body.input).length > maxLength) {
    return NextResponse.json(
      { error: 'Input exceeds maximum allowed tokens' },
      { status: 413 }
    );
  }

  return createStreamResponse(async (streamHandler, streamCallbacks) => {
    try {
      await rag.translateStreaming(body.query, body.instructions, body.input, model, streamCallbacks);
      streamCallbacks.onCompleted(); // Ensure we call onCompleted after translation is done
    } catch (error) {
      console.error("Error in translate streaming:", error);
      streamCallbacks.onError(body.query, error.toString());
    }
  }, false);
}
