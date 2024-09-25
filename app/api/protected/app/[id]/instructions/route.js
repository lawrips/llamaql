import { dataInstructions, queryInstructions, requeryInstructions } from '@/lib/constants/instructions';

const db = require('@/lib/services/sql');
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const utils = require('@/lib/utils/shareUtils');

export async function POST(request, { params }) {
    const { id } = params;
    const session = await getServerSession(authOptions);

    let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

    let { queryInstructions, requeryInstructions, dataInstructions, dataExplanation } = await request.json();

    // update instructions
    let result = db.run(email, dbName, 'UPDATE instructions SET data = ?', JSON.stringify({ queryInstructions, dataInstructions, requeryInstructions }));

    // update schema (specifically data instructions with is the last position in the schema table)
    
    if (dataExplanation) {
        result = db.run(email, dbName, `UPDATE schema SET schema = ? WHERE id = (SELECT MAX(id) FROM schema);`, [dataExplanation]);
        console.log(`inserted dataExplanation result = ${result.changes}`);
    }


    return new Response(JSON.stringify({ message: 'Instructions saved' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    });
}
