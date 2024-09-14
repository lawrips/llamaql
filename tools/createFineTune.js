//const { MongoClient } = require('mongodb');
const rag = require('../lib/rag/sqlite3/rag');

module.exports = {
    exportJson: async function (dbName) {

        let json = '';

        let result = await rag.getSetup(dbName);

        // Convert each document to JSONL format
        result.queries.forEach(doc => {
            let instructions = JSON.parse(result.instructions[0]).queryInstructions.replaceAll('{examples}', "")
            instructions = instructions.replaceAll('{schema}', JSON.stringify(result.schema));
            instructions = instructions.replaceAll('{db}', 'sqlite3');
            instructions = instructions.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));
                    
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

module.exports.exportJson().catch(console.error);
