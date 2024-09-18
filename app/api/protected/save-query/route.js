import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const db = require('@/lib/services/sql');

export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');
    const session = await getServerSession(authOptions);

    let json = await request.json();
    console.log(json);

    // treats userQuery as the primary key... if it's a duplicate userquery it'll overwrite
    let result = db.run(session.user.email, dbName, `
        INSERT INTO queries (userQuery, userAnnotation, dbQuery, dbResult) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userQuery) 
        DO UPDATE SET 
          userAnnotation = excluded.userAnnotation, 
          dbQuery = excluded.dbQuery, 
          dbResult = excluded.dbResult
          WHERE queries.userQuery = excluded.userQuery`,
        [json.userQuery, json.userAnnotation, json.dbQuery, json.dbResult]);

        console.log(result.changes)

    return new Response(JSON.stringify({ message: 'Query result saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');
    const session = await getServerSession(authOptions);

    let json = await request.json();
    console.log(json);

    let result = db.run(session.user.email, dbName, 'DELETE FROM queries WHERE userQuery = ?', [json.userQuery]);
    console.log(result.changes)

    return new Response(JSON.stringify({ message: 'Query result deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
