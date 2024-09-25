require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const db = require('@/lib/services/sql');
const utils = require('@/lib/utils/schemaUtils');
const defaultInstructions = require("@/lib/constants/instructions")

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
        this.username = username;
        this.dbName = dbName;
    }

    getSetup() {
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');
        let dataSchema = db.query(this.username, this.dbName, 'SELECT * FROM schema');
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

    async query(userQuery, annotation, model, instructions, schema, requery, parallelRequeries = 2) {
        // Fetch all queries from the database
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');

        let responses = []; // Array to hold responses

        // Create parallel promises for both initial query workflow and requery workflow
        const queryPromises = [];

        for (let i = 0; i < parallelRequeries; i++) {
            queryPromises.push(this.#queryWorkflow(userQuery, annotation, queries, model || defaultModel, instructions, schema, requery, null));
        }

        // Execute all attempts in parallel
        responses = await Promise.all(queryPromises);


        let choice = await this.#chooseQuery(userQuery, annotation, queries, model || defaultModel, schema, responses)

        // Return aggregated results
        return { query: responses[choice].query, data: responses[choice].data, error: responses[choice].error };
    }


    async translate(query, instructions, data, model) {
        console.log(data)
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
                        content: 'RESULT: ' + JSON.stringify(data)
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

    async createSchema(instructions, schema, data, model) {
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

            return formattedResponse.choices[0].message.content.trim();
        }
    }


    async #queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions = this.instructions, schema, requery, previousEx = null) {
        // Log the current workflow status
        console.log(requery ? 'Performing requery workflow' : 'Performing initial query workflow');

        let dbQuery;

        if (requery) {
            // Requery workflow: regenerate the database query based on the failed query
            // Fetch updated instructions for requery
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = JSON.parse(instructions[0]).requeryInstructions;

            // Regenerate the database query with the failed query as context
            dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, requery, model, instructions, schema, previousEx);
        } else {
            // Initial query workflow: generate the initial database query
            if (!instructions) {
                instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
                instructions = JSON.parse(instructions[0]).queryInstructions;
            }
            dbQuery = await this.#generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema);

            // If there's an error in generating the query, return immediately
            if (dbQuery.error) {
                return { query: dbQuery.query, data: null, error: dbQuery.error };
            }
        }

        try {
            // Execute the generated or regenerated query synchronously
            const result = db.query(this.username, this.dbName, dbQuery.query);
            return { query: dbQuery.query, data: result, error: null };
        } catch (ex) {
            // Determine whether to retry based on the current workflow and previous exception
            if (!requery || (requery && !previousEx)) {
                // If not in a requery workflow or in a requery workflow without a previous exception, retry
                return await this.#queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, dbQuery.query, ex);
            } else {
                // If already in a requery workflow with a previous exception, do not retry and return the error
                return { query: dbQuery.query, data: null, error: ex };
            }
        }
    }

    // Function to generate qb query 
    async #chooseQuery(naturalLanguageQuery, annotation, queries, model, schema, responses) {
        let instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
        instructions = JSON.parse(instructions[0]).chooseInstructions;
        let content = utils.replacePlaceholders(instructions || defaultInstructions.chooseInstructions, queries, schema);
        console.log('user query:')
        console.log(naturalLanguageQuery)
        console.log('annotaiton:')
        console.log(annotation)
        let messages =  [
            {
                role: "system",
                content: content
            },
            {
                role: 'user',
                content: `ORIGINAL USER QUERY: ${naturalLanguageQuery} ([Annotation]: ${annotation})`
            },
        ];

        for (let i=0; i<responses.length; i++) {
            messages.push(
                {
                    role: 'user',
                    content: `OPTION ${i}
                    SQL: ${responses[i].query}
                    Result: ${JSON.stringify(responses[i].data)}
                    Error: ${responses[i].error}
                    `
                },           
            )
        }
        if (provider == 'openai') {
            const response = await openai.chat.completions.create({
                model: model,
                messages: messages,
                max_completion_tokens: maxTokens
            });
            let text = response.choices[0].message.content.replaceAll("\\", "")
            text = cleanupText(text);

            console.log('#chooseQuery choice:')
            console.log(text);

            return text;
        }
    }


    // Function to generate qb query 
    async #generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema) {
        let content = utils.replacePlaceholders(instructions, queries, schema);
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
        let content = utils.replacePlaceholders(instructions, queries, schema);

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

