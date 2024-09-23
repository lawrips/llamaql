import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');
const schemaUtils = require('@/lib/utils/schemaUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  const body = await request.json();
  let input = body.input;
  let annotation = body.annotation;
  let instructions = body.instructions;
  let schema = body.schema;
  let requery = body.requery;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  console.log("****** NEW QUERY REQUEST ******** ")

  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  const rag = new Rag(email, dbName);

  if (!instructions) {
    let setup = await rag.getSetup();
    instructions = schemaUtils.replacePlaceholders(JSON.parse(setup.instructions).queryInstructions, setup.queries, schema);
  }
  let result = await rag.query(input, annotation, model, instructions, schema, requery || null);
  console.log(result)

  if (result.error == null) {
    return new Response(
      JSON.stringify(
        {
          query: result.query,
          data: result.data,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(result.error);
    console.log(result.query);
    return new Response(JSON.stringify({ query: JSON.stringify(result.query), error: JSON.stringify(result.error.toString()) }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}
