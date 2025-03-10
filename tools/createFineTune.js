import { getServerSession } from "next-auth/next";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/schemaUtils');

module.exports = {
    exportJson: async function (username, dbName) {

        let json = '';

        const rag = new Rag(username, dbName);
        let result = rag.getSetup();

        // Convert each document to JSONL format
        //let instructions = utils.replacePlaceholders(JSON.parse(result.instructions).queryInstructions, result.queries, JSON.stringify(result.dataSchema));
        let instructions = JSON.parse(result.instructions).queryInstructions;

        result.queries.forEach(doc => {
                    
            let content = [
                {
                    role: "system",
                    content: instructions
                },
                {
                    role: "user",
                    content: `${doc.userQuery}`
                },
                {
                    role: "user",
                    content: `[Annotation]: ${doc.userAnnotation}`
                },
                {
                    role: "assistant",
                    content: doc.dbQuery
                }
            ];


            // Format JSONL output
            let jsonlLine = `{"messages": ${JSON.stringify(content)}}\n`;

            // Print JSONL line
            json += jsonlLine;
        });

        return json;
    }
}
