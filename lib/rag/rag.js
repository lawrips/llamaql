// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
require('dotenv').config();
const OpenAI = require('openai');
const { MongoClient } = require('mongodb');
const readline = require('readline');
const fs = require('fs');
const {instructions} = require('../constants/instructions.js');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const provider = 'openai';
const defaultModel = 'gpt-4o-mini'
//const model = 'ft:gpt-4o-mini-2024-07-18:personal:test2:9yuy3fEU'

// MongoDB connection URL and Database Name
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);
const dbName = 'ffai';

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



/*
export default async function handler(req, res) {

  if (req.method == 'POST') {

    let userQueries = [];
    const userQuery = req.body.query;
    userQueries.push({ role: 'user', content: userQuery });
    const response = await generateResponse(userQuery, userQueries);


    //    userQueries.push({ role: 'system', content: response });

    res.status(201).json({ status: 'ok', text: response });
  }
}
*/

module.exports = {
    query: async function(userQuery, model) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });
    
        await client.connect();
        const db = client.db(dbName);
        const colection = db.collection('example_queries');
        let exampleQueries = await colection.find({}).toArray();
        
        exampleQueries.map(i => delete i._id)
    
        const response = await queryWorkflow(userQuery, userQueries, exampleQueries, model || defaultModel);
        return response;
    },

    translate: async function(query, mongoResult, model) {
        console.log(mongoResult)
        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                model: model || defaultModel,
                messages: [
                    {
                        role: "system",
                        content: `Format this MongoDB result into a natural language response
                        (use lists where appropriate but NEVER include any markdown in your response)`
                    },
                    {
                        role: 'user',
                        content: 'QUESTION: ' + query
                    },
                    {
                        role: 'user',
                        content: 'RESULT: ' + JSON.stringify(mongoResult)
                    }
                ],
                max_tokens: 4000
            });
            //console.log(formattedResponse.choices[0].message.content.trim());
    
            return formattedResponse.choices[0].message.content.trim();
        }        
    }
}



// Function to generate MongoDB query using GPT-4
async function generateMongoDBQuery(naturalLanguageQuery, exampleQueries, model) {
     let content = instructions + JSON.stringify(exampleQueries);
    //let content = instructions;
    //console.log(content)
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

        console.log('mongo query:')
        console.log(text);


        try {
            text = JSON.parse(text);
        } catch (ex) {
            console.log("Error parsing JSON in generateMongoDBQuery");
            console.log(ex);

            if (model.indexOf('gpt-4o-mini') > -1) {
                console.log("ATTEMPTING A SECOND PASS");
                console.log('sending text:' + text)
                let pass2Response = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a smart assisitant who's job is to check, validate and if necessary fix mongodb queries.
                            Check the submitted natural language queries and the mongo that was generated to achieve the answer to that natural language query.
                            Focus only on syntax. If the query is correct, just return back the same query mongo query. if the query is wrong, return back the fixed query.
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
                    console.log("Error parsing JSON in generateMongoDBQuery");
                    console.log(ex);
        
                    return ({query: text2, error: ex});
                }

                return ({query: text2, err: null});

            }

            return ({query: text, error: ex});
        }
    
        return ({query: text, err: null});
    }

}


// Function to execute MongoDB query
async function executeMongoDBQuery(query) {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('player_stats');

    let results;

    if (Array.isArray(query)) {
        results = (await collection.aggregate(query).toArray());
    } else if (typeof query === 'object') {
        results = await collection.find(query).toArray();
    } else {
        throw new Error('Invalid query format');
    }

    await client.close();
    return results;
}

// Function to generate and format the response
async function queryWorkflow(naturalLanguageQuery, naturalLanguageQueries, exampleQueries, model) {
    //console.log(naturalLanguageQuery);
    //console.log(JSON.stringify(mongoQuery));
    let mongoQuery = await generateMongoDBQuery(naturalLanguageQuery, exampleQueries, model);
    if (mongoQuery.error) {
        return {query: mongoQuery.query, data: null, err: mongoQuery.error};
    }

    try {
        const result = await executeMongoDBQuery(mongoQuery.query);
        //console.log(JSON.stringify(result));
        return {query: mongoQuery.query, data: result, err: null};
    } catch (ex) {
        console.log(ex)
        return {query: mongoQuery.query, data: null, err: ex};
    }
}




