require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const db = require('../../services/sql')

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const provider = 'openai';
const defaultModel = 'gpt-4o-mini'

function extractCode(text) {
    const regex = /```(?:javascript|json|js)\s*([\s\S]*?)\s*```/;
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

module.exports = {
    getQueries: async function (dbName) {

        let queries = await db.query(dbName, 'SELECT * FROM queries');
        let dataSchema = await db.query(dbName, 'SELECT * FROM data_schema');
        let instructions = await db.query(dbName, 'SELECT * FROM instructions', null, true);
        let savedData = await db.query(dbName, 'SELECT * FROM saved_data');

        queries.forEach((item) => {
            let result = savedData.filter(i => i.query == item.messages[0].content);
            if (result.length == 1) {
                item.savedData = result[0].data;
            }
        })

        return { queries: queries, dataSchema: dataSchema, instructions: instructions };


    },

    query: async function (userQuery, model, instructions, schema, dbName) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });

        let queries = await db.query(dbName, 'SELECT * FROM queries');

        const response = await queryWorkflow(userQuery, queries, model || defaultModel, instructions, schema, dbName);
        return response;
    },

    translate: async function (query, instructions, result, model) {
        console.log(result)
        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                model: model || defaultModel,
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
                max_tokens: 4000
            });
            //console.log(formattedResponse.choices[0].message.content.trim());

            return formattedResponse.choices[0].message.content.trim();
        }
    }
}


// Function to generate and format the response
async function queryWorkflow(naturalLanguageQuery, queries, model, instructions, schema, dbName) {
    //console.log(naturalLanguageQuery);
    let dbQuery = await generateDBQuery(naturalLanguageQuery, queries, model, instructions, schema);
    if (dbQuery.error) {
        return { query: dbQuery.query, data: null, error: dbQuery.error };
    }

    try {
        const result = await db.query(dbName, dbQuery.query);
        return { query: dbQuery.query, data: result, error: null };
    } catch (ex) {
        console.log('Error executing db query')
        console.log(ex)
        let dbQuery = await retryQuery(dbQuery.query, naturalLanguageQuery, model);

        try {
            const result = await db.query(dbName, dbQuery.query);
            return { query: dbQuery.query, data: result, error: ex };
        } catch (ex) {
            console.log('Error executing db query on SECOND PASS')
            console.log(ex)

            return { query: dbQuery.query, data: null, error: ex };
        }
    }
}


// Function to generate qb query 
async function generateDBQuery(naturalLanguageQuery, queries, model, instructions, schema) {
    let content = instructions.replaceAll('{examples}', JSON.stringify(queries))
    content = content.replaceAll('{schema}', JSON.stringify(schema));
    content = content.replaceAll('{db}', 'sqlite3');
    content = content.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));
    //let content = instructions;
    console.log('instructions:')
    console.log(content)
    console.log(naturalLanguageQuery)
    if (provider == 'openai') {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `${content}`
                },
                {
                    role: 'user',
                    content: `${naturalLanguageQuery}`
                }
            ],
            max_tokens: 4000
        });
        let text = response.choices[0].message.content.replaceAll("\\", "")
        text = cleanupText(text);

        console.log('db query:')
        console.log(text);

        return ({ query: text, error: null });
    }
}

async function retryQuery(query, naturalLanguageQuery, model) {
    console.log("ATTEMPTING A SECOND PASS");
    console.log('second pass is evaluating:' + query)
    let pass2Response = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: "system",
                content: `You are a smart assisitant who's job is to check, validate and if necessary fix db queries.
                                    Check the submitted natural language queries and the db query that was generated to achieve the answer to that natural language query.
                                    Focus on synta and whether the query will achieve the desired resultx. If the query is correct, just return back the same query db query. if the query is wrong, return back the fixed query.
                                    DO NOT respond with anything else`
            },
            {
                role: 'user',
                content: `${naturalLanguageQuery}`
            },
            {
                role: 'user',
                content: `${query}`
            }
        ],
        max_tokens: 4000
    });
    let text = pass2Response.choices[0].message.content.replaceAll("\\", "")
    text = cleanupText(text);
    text = extractCode(text);
    console.log(text)

    return ({ query: text, error: null });
}

