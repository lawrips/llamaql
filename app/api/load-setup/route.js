import instructions from '@/lib/constants/instructions';

const rag = require('../../../lib/rag/sqlite3/rag');
//const rag = require('../../../lib/rag/mongo/rag');


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const dbName = searchParams.get('app');

    let result = await rag.getQueries(dbName);
    console.log('example queries:');

    console.log(result);

    return new Response(JSON.stringify(
        {
            exampleQueries: result.exampleQueries,
            dataSchema: result.dataSchema,
            instructions: result.instructions
        }
    ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
