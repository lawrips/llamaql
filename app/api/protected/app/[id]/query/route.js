import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');
const schemaUtils = require('@/lib/utils/schemaUtils');
const conversations = require('@/lib/utils/converastionsUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  console.log("****** NEW QUERY REQUEST ******** ")

  const body = await request.json();
  let input = body.input;
  let annotation = body.annotation;
  let instructions = body.instructions;
  let schema = body.schema;
  let generate = body.generate;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');


  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  // reset message history
  conversations.deleteAll(dbName, session.user.email);


  const rag = new Rag(email, dbName);

  let result = await rag.query(input, annotation, model, instructions, schema, generate || null);
  console.log('nuber of rows in result: ' + result.data?.length)

  if (result.error == null) {
    return new Response(
      JSON.stringify(
        {
          query: result.query,
          data: result.data,
          chat: result.chat
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(result.error);
    console.log(result.query);
    return new Response(JSON.stringify({ chat: result.chat, query: result.query, error: result.error.toString() }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}
