require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const db = require('@/lib/services/sql');
const utils = require('@/lib/utils/schemaUtils');

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

    async query(userQuery, annotation, model, instructions, schema, requery) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });
    
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');
    
        let response;
    
        if (requery) {
            // Requery workflow
            response = await this.#queryWorkflow(userQuery, annotation, queries, model || defaultModel, instructions, schema, requery, null);
        } else {
            // Initial query workflow
            response = await this.#queryWorkflow(userQuery, annotation, queries, model || defaultModel, instructions, schema, null, null);
        }
    
        return response;
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


    async #queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, requery, previousEx = null) {
        console.log(isRequery ? 'Performing requery workflow' : 'Performing initial query workflow');
    
        let dbQuery;
    
        if (requery) {
            // Fetch updated instructions for requery
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = JSON.parse(instructions[0]).requeryInstructions;
            instructions = schemaUtils.replacePlaceholders(instructions, queries, schema);
    
            // Regenerate the database query
            dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, requery, model, instructions, schema, previousEx);
        } else {
            // Generate the initial database query
            dbQuery = await this.#generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema);
    
            if (dbQuery.error) {
                return { query: dbQuery.query, data: null, error: dbQuery.error };
            }
        }   
    
        try {
            const result = db.query(this.username, this.dbName, dbQuery.query);
            return { query: dbQuery.query, data: result, error: null };
        } catch (ex) {
            if (!requery || (requery && !previousEx)) {
                // Retry with requery workflow due to exception
                return await this.#queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, dbQuery.query, ex);
            } else {
                // Return error after requery attempt
                return { query: dbQuery.query, data: null, error: ex };
            }
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

