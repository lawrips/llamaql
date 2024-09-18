const { MongoClient } = require('mongodb');

const db = require('@/lib/services/sql')
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 


export async function POST(request) {
  const { input } = await request.json();
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('app');
  const session = await getServerSession(authOptions);

  
  //const result = await mongo.execute(JSON.parse(input), dbName);
  const result = db.query(session.user.email, dbName, input);
  if (result.err == null) {
    return new Response(
      JSON.stringify(
        {
          query: input,
          data: result,
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.log(query.err);
    return new Response(JSON.stringify({ query: query.query, error: "bad query - the db didnt like the form of that" }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }) 
  }
}
