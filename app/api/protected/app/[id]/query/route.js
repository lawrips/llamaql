import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
import { createStreamResponse } from '@/lib/utils/streamUtils';
const utils = require('@/lib/utils/shareUtils');
const conversations = require('@/lib/utils/converastionsUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  console.log("****** NEW QUERY REQUEST ******** ");

  const body = await request.json();
  let { input, annotation, instructions, schema, generate, expectedResults } = body;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  conversations.deleteAll(dbName, session.user.email);

  const rag =   new Rag(email, dbName);

  let streamLogic = async function (streamHandler, streamCallbacks) {
    await rag.queryStreaming(input, annotation, model, instructions, schema, generate || null, expectedResults || null, streamCallbacks);
  }

  return createStreamResponse(streamLogic, true);
}
