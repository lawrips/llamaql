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
    getQueries: async function(dbName) {
    
        let exampleQueries = await db.getAll(dbName,'example_queries');
        let dataSchema = await db.getAll(dbName,'data_schema');
        let instructions = await db.getAll(dbName,'instructions', true);
        let savedData = await db.getAll(dbName,'saved_data');
    
        exampleQueries.forEach((item) => {
            let result = savedData.filter(i => i.query == item.messages[0].content);
            if (result.length == 1) {
                item.savedData = result[0].data;
            }
        })    

        return {exampleQueries: exampleQueries, dataSchema: dataSchema, instructions: instructions};

        
    },

    query: async function(userQuery, model, instructions, schema, dbName) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });

        let exampleQueries = await db.getAll(dbName,'example_queries');
        
        const response = await queryWorkflow(userQuery, exampleQueries, model || defaultModel, instructions, schema, dbName  );
        return response;
    },

    translate: async function(query, instructions, result, model) {
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



// Function to generate qb query using GPT-4
async function generateDBQuery(naturalLanguageQuery, exampleQueries, model, instructions, schema) {
     let content = instructions.replaceAll('{examples}', JSON.stringify(exampleQueries))
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
        let text = response.choices[0].message.content.replaceAll  ("\\", "")
        text = cleanupText(text);

        console.log('db query:')
        console.log(text);



/*            if (model.indexOf('gpt-4o-mini') > -1) {
                console.log("ATTEMPTING A SECOND PASS");
                console.log('second pass is evaluating:' + text)
                let pass2Response = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a smart assisitant who's job is to check, validate and if necessary fix db queries.
                            Check the submitted natural language queries and the db query that was generated to achieve the answer to that natural language query.
                            Focus only on syntax. If the query is correct, just return back the same query db query. if the query is wrong, return back the fixed query.
                            DO NOT respond with anything else - just JSON`
                        },
                        {
                            role: 'user',
                            content: `${text}`
                        }
                    ],
                    max_tokens: 4000
                });
                let text2 = pass2Response.choices[0].message.content.replaceAll  ("\\", "")
                text2 = cleanupText(text2);
                text2 = extractCode(text2);
                console.log(text2)

                try {
                    text2 = JSON.parse(text2);
                } catch (ex) {
                    console.log("Error parsing JSON (second pass)");
                    console.log(ex);
        
                    return ({query: text2, error: ex});
                }

                return ({query: text2, error: null});

            }

            return ({query: text, error: ex});
        }*/
    
        return ({query: text, error: null});
    }

}


// Function to generate and format the response
async function queryWorkflow(naturalLanguageQuery, exampleQueries, model, instructions, schema, dbName) {
    //console.log(naturalLanguageQuery);
    let dbQuery = await generateDBQuery(naturalLanguageQuery, exampleQueries, model, instructions, schema);
    if (dbQuery.error) {
        return {query: dbQuery.query, data: null, error: dbQuery.error};
    }

    try {
        const result = await db.execute(dbQuery.query, dbName);
        return {query: dbQuery.query, data: result, error: null};
    } catch (ex) {
        console.log('Error executing db query')
        console.log(ex)
        return {query: dbQuery.query, data: null, error: ex};
    }
}




