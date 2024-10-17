import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
import { createStreamResponse } from '@/lib/utils/streamUtils';
const utils = require('@/lib/utils/shareUtils');
const conversations = require('@/lib/utils/converastionsUtils');
import defaultInstructions from '@/lib/constants/instructions';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  let { userQuery, userChat, dbQuery, dbResult, chatResult, instructions } = body;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');
  const maxLength = 10000;

  console.log("****** NEW CHAT REQUEST ******** ");
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  if (dbResult && JSON.stringify(dbResult).length > maxLength) {
    return NextResponse.json(
      { error: 'Input exceeds maximum allowed tokens' },
      { status: 413 }
    )
  }

  if (userChat.toLowerCase().startsWith('/chart') ) {
    instructions = defaultInstructions.chartInstructions;
  }

  let history = conversations.getAll(dbName, session.user.email);

  const rag = new Rag(email, dbName);

  return createStreamResponse(async (streamHandler, streamCallbacks) => {
    let accumulatedContent = '';
    const wrappedCallbacks = {
      ...streamCallbacks,
      onProgress: (content) => {
        accumulatedContent += content;
        streamCallbacks.onProgress(content);
      },
      onCompleted: () => {
        conversations.add(dbName, session.user.email, dbQuery, dbResult, userChat, accumulatedContent);
        streamCallbacks.onCompleted();
      }
    };
    await rag.chatStreaming(userQuery, userChat, dbResult, history, instructions, model, wrappedCallbacks);
    streamCallbacks.onCompleted(); // Ensure we call onCompleted after translation is done

  }, false);
}
