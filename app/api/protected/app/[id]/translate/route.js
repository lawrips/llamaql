import Rag from '@/lib/rag/sqlite3/rag';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createStreamResponse } from '@/lib/utils/streamUtils';
const utils = require('@/lib/utils/shareUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');
  const { id } = params;

  console.log("****** NEW TRANSLATE REQUEST ********");

  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };
  const rag = new Rag(email, dbName);

  return createStreamResponse(async (streamHandler, streamCallbacks) => {
    try {
      await rag.translateStreaming(body.query, body.instructions, body.input, model, streamCallbacks);
      streamCallbacks.onCompleted(); // Ensure we call onCompleted after translation is done
    } catch (error) {
      console.error("Error in translate streaming:", error);
      streamCallbacks.onError(error.toString());
    }
  });
}
