import { dataInstructions, queryInstructions, requeryInstructions } from '@/lib/constants/instructions';

const db = require('@/lib/services/sql');
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');
    const session = await getServerSession(authOptions);

    let {queryInstructions, requeryInstructions, dataInstructions, dataSchema} = await request.json();

    let result = db.run(session.user.email, dbName, 'UPDATE instructions SET data = ?' ,JSON.stringify({queryInstructions, dataInstructions, requeryInstructions}));
    console.log(result.changes)
    result = db.run(session.user.email, dbName, 'UPDATE data_schema SET schema = ?, examples = ?' , [JSON.parse(dataSchema)[0].schema, JSON.parse(dataSchema)[0].examples]);
    console.log(result.changes)


    return new Response(JSON.stringify({ message: 'Insructions saved' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    });
}
