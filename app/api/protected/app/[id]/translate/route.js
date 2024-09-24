import Rag from '@/lib/rag/sqlite3/rag';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const utils = require('@/lib/utils/shareUtils');


export async function POST(request, {params}) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { searchParams } = new URL(request.url);

  const model = searchParams.get('model');
  console.log("****** NEW TRANSLATE REQUEST ******** ")

  if (JSON.stringify(body.input).length > 10000) {
    return new Response(
      JSON.stringify(
        {
          result: [],
          error: `request too large`,
        }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };
  const rag = new Rag(email, dbName);

  let instructions = body.instructions;
  if (!instructions) {
    let setup = await rag.getSetup();
    instructions = JSON.parse(setup.instructions).dataInstructions;
  }

  const result = await rag.translate(body.query, instructions, body.input, model);

  return new Response(
    JSON.stringify(
      {
        data: `${result}`,
      }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
