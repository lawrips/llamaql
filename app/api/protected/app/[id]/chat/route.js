import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');
const conversations = require('@/lib/utils/converastionsUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  const body = await request.json();
  let userQuery = body.userQuery;
  let userChat = body.userChat;
  let schema = body.schema;
  let dbQuery = body.dbQuery;
  let dbResult = body.dbResult;
  let chatResult = body.chatResult;
  let instructions = body.instructions;


  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  console.log("****** NEW CHAT REQUEST ******** ")
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  // add this conversation to the history
  let history = conversations.getAll(dbName, session.user.email);

  const rag = new Rag(email, dbName);
  
  let result = await rag.chat(userQuery, userChat, dbResult, history, null, null);
  //console.log(result)

  if (result.error == null) {
    conversations.add(dbName, session.user.email, dbQuery, dbResult, userChat, result.chat);

    return new Response(
      JSON.stringify(
        {
          chat: result.chat
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(result.error);
    return new Response(JSON.stringify({ query: JSON.stringify(result.query), chat: result.chat, error: JSON.stringify(result.error.toString()) }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}
