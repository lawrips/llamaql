const { MongoClient } = require('mongodb');

const db = require('@/lib/services/sql')
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
const utils = require('@/lib/utils/shareUtils');


export async function POST(request, {params}) {
  const { input } = await request.json();
  const { id } = params;
  const session = await getServerSession(authOptions);
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  
  //const result = await mongo.execute(JSON.parse(input), dbName);
  const result = db.query(email, dbName, input);
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
