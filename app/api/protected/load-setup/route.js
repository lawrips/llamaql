const rag = require('@/lib/rag/sqlite3/rag');

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');
    try {
        let result = await rag.getSetup(dbName);
        console.log('example queries:');
        console.log(result);

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
                instructions: result.instructions
            }
        ), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (ex) {
        return new Response(JSON.stringify(null), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
