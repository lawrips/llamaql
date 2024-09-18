require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const db = require('@/lib/services/sql');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const provider = 'openai';
const defaultModel = 'gpt-4o-mini'
const maxTokens = 4000;

function extractCode(text, type) {
    let regex;
    if (!type || type == 'sql') {
        regex = /```(?:sql)\s*([\s\S]*?)\s*```/;
    }
    else if (type == 'json') {
        regex = /```(?:json)\s*([\s\S]*?)\s*```/;
    }

    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

function cleanupText(text) {
    // Remove content within /* and */ (including the delimiters)
    let cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove leading and trailing quotes if they exist
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    // Trim any whitespace from the start and end
    cleaned = cleaned.trim();

    return cleaned;
}

class Rag {
    constructor(username, dbName) {
        this.username = username,
            this.dbName = dbName;
    }

    async getSetup() {
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');
        let dataSchema = db.query(this.username, this.dbName, 'SELECT * FROM data_schema');
        let instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
        let savedData = db.query(this.username, this.dbName, 'SELECT * FROM saved_data');

        queries.forEach((item) => {
            let result = savedData.filter(i => i.query == item.messages[0].content);
            if (result.length == 1) {
                item.savedData = result[0].data;
            }
        })

        return { queries: queries, dataSchema: dataSchema, instructions: instructions };
    }

    async query(userQuery, annotation, model, instructions, schema, requery) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });

        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');

        let response;
        if (!requery) {
            response = await this.#queryWorkflow(userQuery, annotation, queries, model || defaultModel, instructions, schema);
        }
        else {
            response = await this.#requeryWorkflow(userQuery, annotation, queries, requery, model || defaultModel, instructions, schema, false);
        }
        return response;
    }

    async translate(query, instructions, result, model) {
        console.log(result)
        //console.log(instructions)
        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                //model: model || defaultModel,
                model: defaultModel,
                messages: [
                    {
                        role: "system",
                        content: instructions
                    },
                    {
                        role: 'user',
                        content: 'QUESTION: ' + query
                    },
                    {
                        role: 'user',
                        content: 'RESULT: ' + JSON.stringify(result)
                    }
                ],
                max_completion_tokens: maxTokens
            });
            //console.log(formattedResponse.choices[0].message.content.trim());

            return formattedResponse.choices[0].message.content.trim();
        }
    }

    async createExamples(instructions, schema, data, model) {
        //console.log(instructions)
        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                //model: model || defaultModel,
                model: defaultModel,
                messages: [
                    {
                        role: "system",
                        content: instructions
                    },
                    {
                        role: 'user',
                        content: 'DATA SCHEMA: ' + schema
                    },
                    {
                        role: 'user',
                        content: 'EXAMPLE DATA: ' + data
                    }
                ],
                max_completion_tokens: maxTokens
            });
            console.log(formattedResponse.choices[0].message.content.trim());

            return JSON.parse(extractCode(formattedResponse.choices[0].message.content.trim(), 'json'));
        }
    }


    // Function to generate and format the response
    async #queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema) {
        //console.log(naturalLanguageQuery);
        let dbQuery = await this.#generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema);

        if (dbQuery.error) {
            return { query: dbQuery.query, data: null, error: dbQuery.error };
        }

        try {
            const result = db.query(this.username, this.dbName, dbQuery.query);
            return { query: dbQuery.query, data: result, error: null };
        } catch (ex) {
            const result = await this.#requeryWorkflow(naturalLanguageQuery, annotation, queries, dbQuery.query, model, instructions, schema, ex);
            return { query: dbQuery.query, data: result, error: null };
        }
    }

    async #requeryWorkflow(naturalLanguageQuery, annotation, queries, query, model, instructions, schema, previousEx) {
        console.log('Performing requery workflow')

        // if no error is passed in, we'll run this and if there's an error we'll rerun
        if (!previousEx) {
            let dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, query, model, instructions, schema, previousEx);

            try {
                const result = db.query(this.username, this.dbName, dbQuery.query);
                return { query: dbQuery.query, data: result, error: null };
            } catch (ex) {
                // caught an error on a reqeuery, lets give it another go
                console.log('Error executing db query on EXCEPTION RETRY')
                console.log(ex)
                let instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
                instructions = JSON.parse(instructions[0]).requeryInstructions;    

                dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, query, model, instructions, schema, previousEx);
                try {
                    result = db.query(this.username, this.dbName, dbQuery.query);
                    return { query: dbQuery.query, data: result, error: null };
                } catch (ex) {
                    return { query: dbQuery.query, data: result, error: ex };
                }
            }
        }
        else {
            // we've already had a previous error so we'll try just once more
            console.log(previousEx)
            // we fetch instructions from the db in this case
            let instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = JSON.parse(instructions[0]).requeryInstructions;
            let dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, query, model, instructions, schema, previousEx);
            const result = db.query(this.username, this.dbName, dbQuery.query);
            return { query: dbQuery.query, data: result, error: null };
        }
    }


    // Function to generate qb query 
    async #generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema) {
        let content = instructions.replaceAll('{examples}', JSON.stringify(queries))
        content = content.replaceAll('{schema}', JSON.stringify(schema));
        content = content.replaceAll('{db}', 'sqlite3');
        content = content.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));
        console.log('user query:')
        console.log(naturalLanguageQuery)
        console.log('annotaiton:')
        console.log(annotation)
        if (provider == 'openai') {
            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: content
                    },
                    {
                        role: 'user',
                        content: naturalLanguageQuery
                    },
                    ...(annotation ? [{
                        role: 'user',
                        content: `[Annotation]: ${annotation}`
                    }] : []), // Conditional spread to include the annotation if it exists

                ],
                max_completion_tokens: maxTokens
            });
            let text = response.choices[0].message.content.replaceAll("\\", "")
            text = cleanupText(text);

            console.log('db query:')
            console.log(text);

            return ({ query: text, error: null });
        }
    }

    async #regenerateDBQuery(naturalLanguageQuery, annotation, queries, query, model, instructions, schema, ex) {
        console.log('Retry pass is evaluating:' + query)
        let content = instructions.replaceAll('{examples}', JSON.stringify(queries))
        content = content.replaceAll('{schema}', JSON.stringify(schema));
        content = content.replaceAll('{db}', 'sqlite3');
        content = content.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));

        if (ex) {
            content += "\n\nFinally, some information on the exception that occurred when attempting to run the query: " + ex.message;
        }
        console.log(content);
        let pass2Response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: content
                },
                {
                    role: 'user',
                    content: `Original Natural Language Query: ${naturalLanguageQuery}`
                },
                ...(annotation ? [{
                    role: 'user',
                    content: `[Annotation]: ${annotation}`
                }] : []), // Conditional spread to include the annotation if it exists
                {
                    role: 'user',
                    content: `Failed / incorrect SQL: ${query}`
                }
            ],
            max_completion_tokens: maxTokens
        });
        let text = pass2Response.choices[0].message.content.replaceAll("\\", "")
        text = cleanupText(text);
        console.log(text);
        if (text.includes('```sql')) {
            text = extractCode(text);
        }

        return ({ query: text, error: null });
    }
}

export default Rag;

