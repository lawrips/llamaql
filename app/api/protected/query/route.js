import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import Rag from '@/lib/rag/sqlite3/rag';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  const body = await request.json();
  let input = body.input;
  let annotation = body.annotation;
  let instructions = body.instructions;
  let schema = body.schema;
  let requery = body.requery;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');
  const dbName = searchParams.get('app');

  console.log("****** NEW QUERY REQUEST ******** ")


  const rag = new Rag(session.user.email, dbName);
  let result = await rag.query( input, annotation, model, instructions, schema, requery || null);  
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
