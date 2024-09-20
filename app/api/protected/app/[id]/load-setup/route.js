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
        let result = await rag.getSetup();

        /*    result.queries = result.queries.map((i) => JSON.parse(i.data));
        
           result.queries = result.queries.map((i) => {return {
                userQuery: i.messages[0].content.replace(/\/\* Annotation:\s*.*?\s*\*\//s, "").trim(),
                userAnnotation: i.messages[0].content.match(/\/\* Annotation:\s*(.*?)\s*\*\//s)[1].trim(),
                dataQuery: i.messages[1].content            
                }
            })*/

        return new Response(JSON.stringify(
            {
                queries: result.queries,
                dataSchema: result.dataSchema,
                instructions: result.instructions,
                shared: shared
            }
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
