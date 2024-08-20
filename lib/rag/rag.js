// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
require('dotenv').config();
const OpenAI = require('openai');
const { MongoClient } = require('mongodb');
const readline = require('readline');
const fs = require('fs');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const model = 'openai';

// MongoDB connection URL and Database Name
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);
const dbName = 'ffai';

function extractCode(text) {
    const regex = /```(?:javascript|json|js)\s*([\s\S]*?)\s*```/;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

const jsonExample = require('../constants/example.json')



const instructions = `***INSTRUCTIONS***
                  Generate MongoDB queries and format the returned data for nfl player stats queries workouts. ONLY RETURN THE MONGO QUERY IN THE RESPONSE (no additional formatting or context).
                  I will give you a natural language query which you should respond with a MongoDB query that would generate the expected response from MongoDB.
                  ***DETAILS***:
                      * Whenever you use dates, use standard ISO formatted dates (e.g. 2021-11-20) - do not use the Date() object
                      * Assume "today" is 2024-07-31. If no date or year is specified in the user's query, assume they are referring to 2023
                      * NEVER include any markdown or formatting in ANY response. It is critical that you respect this instruction.
                      * Do not hallucinate column names. if it is not in the sample json format below, then it's not available
                      * ALWAYS respect instructions for ranking / ordering and specific requests of what to display.
                      * Do not put comments in JSON as this will fail
                  ***SAMPLE DATA***
                  JSON Format:\n${JSON.stringify(jsonExample, null, 2)}\n
                  Example user and MongoDB queries are shown in the JSON below. with  the natural language user query and 
                the corresponding mongo queries to accomplish these questions:\n`;

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
    query: async function(userQuery) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });
    
        await client.connect();
        const db = client.db(dbName);
        const colection = db.collection('example_queries');
        let exampleQueries = await colection.find({}).toArray();
        
        exampleQueries.map(i => delete i._id)
    
        const response = await mongoQuery(userQuery, userQueries, exampleQueries);
        return response;
    },

    translate: async function(mongoQuery) {
        if (model == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: "system",
                        content: `Format this MongoDB result into a natural language response`
                    },
                    /*{
                      role: 'user',
                      content: JSON.stringify(naturalLanguageQueries)
                    },*/
                    {
                        role: 'user',
                        content: 'RESULT: ' + JSON.stringify(mongoQuery)
                    }
                ],
                max_tokens: 4000
            });
            console.log(formattedResponse.choices[0].message.content.trim());
    
            return formattedResponse.choices[0].message.content.trim();
        }        
    }
}



// Function to generate MongoDB query using GPT-4
async function generateMongoDBQuery(naturalLanguageQuery, exampleQueries) {
    if (model == 'openai') {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: "system",
                    content: `${instructions + JSON.stringify(exampleQueries)}`
                },
                {
                    role: 'user',
                    content: `${naturalLanguageQuery}`
                }
            ],
            max_tokens: 4000
        });
        console.log(response.choices[0].message.content);

        return JSON.parse(response.choices[0].message.content);
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
async function mongoQuery(naturalLanguageQuery, naturalLanguageQueries, exampleQueries) {
    console.log(naturalLanguageQuery);
    let mongoQuery = await generateMongoDBQuery(naturalLanguageQuery, exampleQueries);
    console.log(JSON.stringify(mongoQuery));

    const result = await executeMongoDBQuery(mongoQuery);
    console.log(JSON.stringify(result));

    return {query: mongoQuery, result: result};
}




