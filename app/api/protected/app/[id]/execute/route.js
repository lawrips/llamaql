const { MongoClient } = require('mongodb');

const db = require('@/lib/services/sql')
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const utils = require('@/lib/utils/shareUtils');


export async function POST(request, { params }) {
  const { input } = await request.json();
  const { id } = params;
  const session = await getServerSession(authOptions);
  console.log("****** NEW EXECUTE REQUEST ******** ")

  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  try {
    const result = db.query(email, dbName, input);
    console.log("count: " + result.length);

    return new Response(
      JSON.stringify(
        {
          query: input,
          data: result,
        }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (ex) {
    console.log(ex.message);
    return new Response(JSON.stringify({ query: input, error: ex.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}
