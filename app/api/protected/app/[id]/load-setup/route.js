import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');

export async function GET(request, { params }) {
    const { id } = params;
    let session = await getServerSession(authOptions);

    let { dbName, user: email, shared } = utils.getShared(id) || { dbName: id, user: session.user.email };

    try {
        const rag = new Rag(email, dbName);
        let result = rag.getSetup();

        let responseData = {};
        if (session.user.role == 'admin') {
            responseData =
            {
                queries: result.queries,
                dataSchema: result.dataSchema,
                instructions: result.instructions,
                shared: shared
            }

        }
        else {
            responseData =
            {
                queries: result.queries,
                dataSchema: result.dataSchema,
                shared: shared
            }
        }
        return new Response(JSON.stringify(
            responseData
        ), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                body: JSON.stringify(shared)
            }
        });
    } catch (ex) {
        return new Response(JSON.stringify(null), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
