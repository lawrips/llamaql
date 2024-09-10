// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const service = require('../../services/graphql')
const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');


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
    query: async function(userQuery, model, instructions, schema, dbName) {
        let userQueries = [];
        userQueries.push({ role: 'user', content: userQuery });

        let queries = await service.getAll(dbName);
    
        queries.map(i => delete i._id)
    
        let query = await generate(userQuery, queries, model || defaultModel, instructions, schema);
        if (query.error) {
            return {query: query.query, data: null, error: query.error};
        }

        try {
            const result = await service.execute(gql(query.query.query), query.query.filter, 100, 'launch_year', dataPath);
            //const result = await service.execute(GET_LAUNCHES, filter, 200, 'launch_year', dataPath);
            console.log("Filtered:");
            console.log(result)
          
            return {query: query.query, data: result, error: null};
        } catch (ex) {
            console.log('Error executing query')
            console.log(ex)
            return {query: query.query, data: null, error: ex};
        }
    },

    translate: async function(query, result, model) {
        console.log('translating:')
        console.log(result)
        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            const formattedResponse = await openai.chat.completions.create({
                model: model || defaultModel,
                messages: [
                    {
                        role: "system",
                        content: `Format this result into a natural language response
                        (use lists where appropriate but NEVER include any markdown in your response)`
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



// Function to generate query using GPT-4
async function generate(naturalLanguageQuery, queries, model, instructions, schema) {
     let content = instructions.replace('${examples}', JSON.stringify(queries))
     content = content.replace('${schema}', JSON.stringify(schema));
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
        console.log('query:')
        console.log(text);

        try {
        text = JSON.parse(text);
        } catch (ex) {
            return ({query: text, error: null});

        }


/*        try {
            text = JSON.parse(text);
        } catch (ex) {
            console.log("Error parsing JSON (first pass)");
            console.log(ex);

            if (model.indexOf('gpt-4o-mini') > -1) {
                console.log("ATTEMPTING A SECOND PASS");
                console.log('second pass is evaluating:' + text)
                let pass2Response = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a smart assisitant who's job is to check, validate and if necessary fix queries.
                            Check the submitted natural language queries and query that was generated to achieve the answer to that natural language query.
                            Focus only on syntax. If the query is correct, just return back the same query. if the query is wrong, return back the fixed query.
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



const GET_LAUNCHES = gql`
query GetLaunches($limit: Int, $order: String) {
   launches(limit: $limit, order: $order) {
     links {
       article_link
       flickr_images
       video_link
     }
     launch_site {
       site_name
     }
     launch_success
     launch_date_local
     launch_year
     rocket {
       rocket_name
       rocket_type
       rocket {
         company
         cost_per_launch
         country
         mass {
           lb
         }
       }
     }
     upcoming
   }
}
`;

// Sample JSON payload with filter criteria
const dataPath= "launches";
//const filter = "launch_site.site_name = \"Republic of the Marshall Islands\""
//const filter = "rocket.rocket.mass.lb < 100000";
//const filter = "launch_year >= 2020"



