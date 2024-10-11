require('dotenv').config();
const OpenAI = require('openai');
import fetch from 'node-fetch';
import { Readable } from 'stream';
const readline = require('readline');
const fs = require('fs');
const db = require('@/lib/services/sql');
const utils = require('@/lib/utils/schemaUtils');
const defaultInstructions = require("@/lib/constants/instructions")
import nodeFetch from 'node-fetch';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const provider = 'openrouter';
//const defaultModel = 'google/gemini-flash-1.5'
//const simpleModel = 'google/gemini-pro-1.5-exp';
const simpleModel = 'google/gemini-flash-1.5'
//const simpleModel = 'anthropic/claude-3-haiku'
//  const defaultModel = 'anthropic/claude-3-haiku'

//const simpleModel = 'openai/gpt-4o-mini'
//const simpleModel = 'google/gemini-pro-1.5';
//const defaultModel = 'anthropic/claude-3-haiku' //'gpt-4o-mini' ''
const defaultModel = 'anthropic/claude-3.5-sonnet:beta';
//const defaultModel = 'openai/gpt-4o-mini'
//const defaultModel = 'openai/gpt-4o-mini'
//const defaultModel = 'google/gemini-pro-1.5-exp';
//const defaultModel = 'google/gemini-pro-1.5'
//const defaultModel = 'google/gemini-flash-1.5'
//const defaultModel = 'qwen/qwen-2.5-72b-instruct' //'gpt-4o-mini' ''
//const defaultModel = 'openai/gpt-4o-2024-08-06'
const advancedModel = ['anthropic/claude-3-haiku', 'anthropic/claude-3-haiku']
const maxTokens = 4000;


function processCode(text, type, action) {
    // Create a dynamic regex that matches the passed-in type (e.g., sql or json)
    const regex = new RegExp(`\`\`\`(?:${type})\\s*([\\s\\S]*?)\\s*\`\`\``, 'g');

    if (action === 'extract') {
        // Extract the last code block for the specified type
        const matches = [...text.matchAll(regex)];
        return matches.length > 0 ? matches[matches.length - 1][1].trim() : '';
    } else if (action === 'remove') {
        // Remove all code blocks of the specified type
        return text.replace(regex, '').trim();
    } else {
        throw new Error("Invalid action. Use 'extract' or 'remove'.");
    }
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


    async translateStreaming(query, instructions, data, model, onChunk) {
        console.log(data);

        const message = {
            model: simpleModel,
            messages: [
                {
                    role: "system",
                    content: instructions
                },
                ...(query ? [{
                    role: 'user',
                    content: 'QUESTION: ' + query
                }] : []),
                {
                    role: 'user',
                    content: 'RESULT: ' + JSON.stringify(data)
                }
            ],
            stream: true, // Enable streaming mode
            max_tokens: 1000,
        };

        // Make a streaming request to OpenRouter using node-fetch
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error('Failed to connect to OpenRouter for streaming');
        }

        // Convert readable stream to Node's Readable stream
        const reader = Readable.from(response.body);

        // Read the data stream using Node's readable stream
        reader.on('data', (chunk) => {
            const text = chunk.toString();

            // Split by newline to handle multiple chunks in one read
            const lines = text.split("\n");

            // Process each line
            for (let line of lines) {
                line = line.trim();

                if (line.startsWith('data:')) {
                    // Remove the 'data:' prefix to get the actual JSON
                    line = line.replace('data:', '').trim();
                } else {
                    // If the line does not start with 'data:', skip it (in case there's malformed data)
                    continue;
                }

                if (line) {
                    try {
                        if (line != '[DONE]') {
                            const parsedChunk = JSON.parse(line);

                            // Send each valid chunk to the callback if it has actual content
                            if (parsedChunk && parsedChunk.choices && parsedChunk.choices[0].delta) {
                                const content = parsedChunk.choices[0].delta.content;
                                if (content && content.trim() !== "") {
                                    // Send the meaningful content chunk
                                    onChunk({ content: content, status: 'in-progress' });
                                }
                            }
                        } else {
                            console.log('[DONE] received - completed');
                            onChunk({ content: '', status: 'completed' });

                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e);
                    }
                }
            }
        });

        reader.on('end', () => {
            console.log("Streaming finished.");
        });

        reader.on('error', (err) => {
            console.error("Streaming error:", err);
        });
    }


    async chatStreaming(userQuery, userChat, dbResult, messages, instructions, model, onChunk) {
        // Set default instructions if none are provided
        if (!instructions) {
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = defaultInstructions.chatInstructions;
        }

        // Construct the AI content payload
        let aiContent = {
            model: model || simpleModel,
            messages: [
                {
                    role: "system",
                    content: instructions
                },
                {
                    role: 'user',
                    content: 'ORIGINAL QUERY: ' + userQuery
                },
                {
                    role: 'user',
                    content: 'RESULT: ' + JSON.stringify(dbResult)
                }
            ],
            max_tokens: maxTokens,
            stream: true // Enable streaming mode
        };

        // Append previous messages to maintain context
        messages.forEach((message) => {
            aiContent.messages.push({
                role: 'user',
                content: message.userChat
            });
            aiContent.messages.push({
                role: 'assistant',
                content: message.chatResult
            });
        });

        // Add the user's most recent chat message
        aiContent.messages.push({
            role: 'user',
            content: userChat
        });

        // Make a streaming request to OpenRouter using node-fetch
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(aiContent)
        });

        if (!response.ok) {
            throw new Error('Failed to connect to OpenRouter for streaming');
        }

        // Convert readable stream to Node's Readable stream
        const reader = Readable.from(response.body);

        // Read the data stream using Node's readable stream
        reader.on('data', (chunk) => {
            const text = chunk.toString();

            // Split by newline to handle multiple chunks in one read
            const lines = text.split("\n");

            // Process each line
            for (let line of lines) {
                line = line.trim();

                if (line.startsWith('data:')) {
                    // Remove the 'data:' prefix to get the actual JSON
                    line = line.replace('data:', '').trim();
                } else {
                    // If the line does not start with 'data:', skip it (in case there's malformed data)
                    //console.log('skipped data!!!!: ', line)
                    continue;
                }

                if (line) {
                    try {
                        if (line !== '[DONE]') {
                            const parsedChunk = JSON.parse(line);

                            // Send each valid chunk to the callback if it has actual content
                            if (parsedChunk && parsedChunk.choices && parsedChunk.choices[0].delta) {
                                const content = parsedChunk.choices[0].delta.content;
                                if (content && content.trim() !== "") {
                                    // Send the meaningful content chunk
                                    onChunk({ content: content, status: 'in-progress' });
                                }
                            }
                        } else {
                            console.log('[DONE] received - completed');
                            onChunk({ content: '', status: 'completed' });
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e);
                    }
                }
            }
        });

        reader.on('end', () => {
            console.log("Streaming finished.");
        });

        reader.on('error', (err) => {
            console.error("Streaming error:", err);
        });
    }


    async createExamples(instructions, schema, data, model) {
        //console.log(instructions)
        let message = {
            //model: defaultModel || defaultModel,
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
        };
        let formattedResponse;

        if (provider == 'openai') {
            // Optionally, format the results using GPT-4
            formattedResponse = await openai.chat.completions.create(message);

        }
        else if (provider == 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });
            formattedResponse = await response.json();
        }
        let text = processCode(formattedResponse.choices[0].message.content.trim(), 'json', 'extract');
        console.log(text)
        return JSON.parse(text);

    }

    async createSchemaExplanation(instructions, schema, data, model) {
        //console.log(instructions)
        let message = {
            model: model || defaultModel,
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
        };

        let formattedResponse;

        if (provider == 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });
            formattedResponse = await response.json();
        }
        let text = formattedResponse.choices[0].message.content.trim();
        console.log(text);

        return text;

    }

    async queryStreaming(userQuery, annotation, model, instructions, schema, generate, onChunk, parallelRequeries = 2) {
        // Fetch all queries from the database
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');

        if (!generate) {
            let response = await this.#queryWorkflow(userQuery, annotation, queries, defaultModel, instructions, schema, false, null, onChunk);
            // Send the final result via onChunk with 'query-executed' status
            if (onChunk) {
              onChunk({ content: JSON.stringify(response), status: 'query-executed' });
              // Optionally, signal stream completion if appropriate
              onChunk({ content: '', status: 'stream-completed' });
            }
            return response;
          } else {
            // Generation mode - more complex flow

            let responses = []; // Array to hold responses

            // Create parallel promises for both initial query workflow and requery workflow
            const queryPromises = [];

            for (let i = 0; i < parallelRequeries; i++) {
                // Omit onChunk when calling queryWorkflow
                queryPromises.push(this.#queryWorkflow(userQuery, annotation, queries, advancedModel[i % advancedModel.length], instructions, schema, false, null));
            }

            // Execute all attempts in parallel
            responses = await Promise.all(queryPromises);

            // Pass onChunk to chooseQuery
            let chosenSQL = await this.#chooseQuery(userQuery, annotation, queries, advancedModel[0], schema, responses, onChunk);
            let result = [];
            try {
                result = db.query(this.username, this.dbName, chosenSQL.sql);
                const finalResult = { query: chosenSQL.sql, chat: chosenSQL.chat, data: result, error: null };
                // Send the final result via onChunk with 'query-executed' status
                if (onChunk) {
                  onChunk({ content: JSON.stringify(finalResult), status: 'query-executed' });
                  // Signal stream completion
                  onChunk({ content: '', status: 'stream-completed' });
                }
                return finalResult;
              } catch (ex) {
                console.log(ex);
                const errorResult = { query: chosenSQL.sql, chat: chosenSQL.chat, data: null, error: ex };
                if (onChunk) {
                  onChunk({ content: JSON.stringify(errorResult), status: 'error' });
                }
                return errorResult;
              }
        }
    }


    async #queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, requery, previousEx, onChunk = null) {
        // Log the current workflow status
        console.log(requery ? 'Performing requery workflow' : 'Performing initial query workflow');

        let dbQuery;

        if (requery) {
            // Requery workflow: regenerate the database query based on the failed query
            // Fetch updated instructions for requery
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = JSON.parse(instructions[0]).requeryInstructions;

            // Regenerate the database query with the failed query as context
            dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, previousEx.query, model, instructions, schema, previousEx.error, onChunk);
        } else {
            // Initial query workflow: generate the initial database query
            if (!instructions) {
                instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
                instructions = JSON.parse(instructions[0]).queryInstructions;
            }
            dbQuery = await this.#generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema, onChunk);

            // If there's an error in generating the query, return immediately
            if (dbQuery.error) {
                console.log("ERROR WHILE GENERATING QUERY: " + dbQuery.error);
                return { query: dbQuery.query, chat: dbQuery.chat, data: null, error: dbQuery.error };
            }
        }

        try {
            // Failsafe clean query text if necessary
            if (dbQuery.query.includes('```sql')) {
                dbQuery.query = processCode(dbQuery.query, 'sql', 'extract');
            }

            // Execute the generated or regenerated query synchronously
            const result = db.query(this.username, this.dbName, dbQuery.query);

            // Send the execution result back via onChunk
            if (onChunk) {
                onChunk({ content: JSON.stringify({ query: dbQuery.query, data: result }), status: 'query-executed' });
            }

            return { query: dbQuery.query, chat: dbQuery.chat, data: result, error: null };
        } catch (ex) {
            console.log(ex);
            // Determine whether to retry based on the current workflow and previous exception
            if (!requery || (requery && !previousEx)) {
                // If not in a requery workflow or in a requery workflow without a previous exception, retry
                return await this.#queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, true, { query: dbQuery.query, error: ex }, onChunk);
            } else {
                // If already in a requery workflow with a previous exception, do not retry and return the error
                return { query: dbQuery.query, chat: dbQuery.chat, data: null, error: ex };
            }
        }
    }



    async #chooseQuery(naturalLanguageQuery, annotation, queries, model, schema, responses, onChunk) {
        let instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
        instructions = JSON.parse(instructions[0]).chooseInstructions;
        let content = utils.replacePlaceholders(instructions || defaultInstructions.chooseInstructions, queries, schema);
        console.log('user query:' + naturalLanguageQuery);
        console.log('annotation:' + annotation);
        let messages = [
            {
                role: "system",
                content: content
            },
            {
                role: 'user',
                content: `ORIGINAL USER QUERY: ${naturalLanguageQuery} ([Annotation]: ${annotation})`
            },
        ];

        for (let i = 0; i < responses.length; i++) {
            console.log(`Evaluating query ${i}`);
            messages.push(
                {
                    role: 'user',
                    content: "***OPTION " + i + "***\n" +
                        "SQL:" + responses[i].query + "\n" +
                        "Result:" + JSON.stringify(responses[i].data) + "\n" +
                        "Error:" + responses[i].error?.toString()
                },
            );
            console.log(JSON.stringify(responses[i].data));
        }

        if (provider == 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        model: model,
                        messages: messages,
                        max_completion_tokens: maxTokens,
                        stream: true // Enable streaming
                    }
                )
            });

            if (!response.ok) {
                throw new Error('Failed to connect to OpenRouter for streaming');
            }

            // Process the streaming response
            const reader = Readable.from(response.body);

            let fullText = '';

            reader.on('data', (chunk) => {
                const text = chunk.toString();

                const lines = text.split("\n");

                for (let line of lines) {
                    line = line.trim();

                    if (line.startsWith('data:')) {
                        line = line.replace('data:', '').trim();
                    } else {
                        continue;
                    }

                    if (line) {
                        try {
                            if (line !== '[DONE]') {
                                const parsedChunk = JSON.parse(line);

                                if (parsedChunk && parsedChunk.choices && parsedChunk.choices[0].delta) {
                                    const content = parsedChunk.choices[0].delta.content;
                                    if (content && content.trim() !== "") {
                                        fullText += content;
                                        // Send chunk to client via onChunk
                                        if (onChunk) {
                                            onChunk({ content: content, status: 'in-progress' });
                                        }
                                    }
                                }
                            } else {
                                console.log('[DONE] received - completed');
                                if (onChunk) {
                                    onChunk({ content: '', status: 'completed' });
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk:", e);
                        }
                    }
                }
            });

            reader.on('end', () => {
                console.log("Streaming finished.");
            });

            reader.on('error', (err) => {
                console.error("Streaming error:", err);
            });

            return new Promise((resolve, reject) => {
                reader.on('end', () => {
                    // Process the accumulated fullText
                    let text = fullText;
                    text = cleanupText(text);

                    console.log(text);
                    let sql = processCode(text, 'sql', 'extract');

                    resolve({ sql: sql, chat: text });
                });

                reader.on('error', (err) => {
                    reject(err);
                });
            });
        }
    }

    async #generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema, onChunk) {
        let content = utils.replacePlaceholders(instructions, queries, schema);
        console.log('user query:' + naturalLanguageQuery);
        console.log('annotation:' + annotation);
    
        let message = {
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
                }] : [])
            ],
            max_tokens: maxTokens,
            stream: true // Enable streaming
        };
    
        if (provider == 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });
    
            if (!response.ok) {
                throw new Error('Failed to connect to OpenRouter for streaming');
            }
    
            // Use the helper function to process the streaming response
            let fullText = await processStreamingResponse(response, onChunk);
    
            // Process the accumulated fullText
            let text = fullText.replaceAll("\\", "");
            text = cleanupText(text);
    
            console.log('db query:');
            console.log(text);
    
            return { query: text, chat: text, error: null };
        } else {
            throw new Error('Unsupported provider');
        }
    }
    

    async #regenerateDBQuery(naturalLanguageQuery, annotation, queries, previousQuery, model, instructions, schema, ex, onChunk) {
        console.log('In regenerateDBQuery method. Retry pass is evaluating:\n' + previousQuery);
        let content = utils.replacePlaceholders(instructions, queries, schema);
    
        // Construct the messages for the chat completion
        let message = {
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
                }] : []),
                {
                    role: 'user',
                    content: `Failed / incorrect SQL: ${previousQuery}`
                },
                ...(ex ? [{
                    role: 'user',
                    content: "Exception when attempting to run the query: " + ex.message?.toString()
                }] : [])
            ],
            max_tokens: maxTokens,
            stream: true // Enable streaming
        };
    
        if (provider == 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });
    
            if (!response.ok) {
                throw new Error('Failed to connect to OpenRouter for streaming');
            }
    
            // Use the helper function to process the streaming response
            let fullText = await processStreamingResponse(response, onChunk);
    
            // Process the accumulated fullText
            let text = fullText.replaceAll("\\", "");
            text = cleanupText(text);
    
            console.log('Regenerated SQL query:');
            console.log(text);
    
            let sql = '';
            if (text.includes('```sql')) {
                sql = processCode(text, 'sql', 'extract');
            } else {
                sql = text; // Assume the whole text is the SQL if not wrapped
            }
    
            return { query: sql, chat: text, error: null };
        } else {
            throw new Error('Unsupported provider');
        }
    }
    


}

async function processStreamingResponse(response, onChunk) {
    return new Promise((resolve, reject) => {
        // Convert readable stream to Node's Readable stream
        const reader = Readable.from(response.body);
        let fullText = '';

        // Read the data stream using Node's readable stream
        reader.on('data', (chunk) => {
            const text = chunk.toString();

            // Split by newline to handle multiple chunks in one read
            const lines = text.split("\n");

            // Process each line
            for (let line of lines) {
                line = line.trim();

                if (line.startsWith('data:')) {
                    // Remove the 'data:' prefix to get the actual JSON
                    line = line.replace('data:', '').trim();
                } else {
                    // Skip lines that don't start with 'data:'
                    continue;
                }

                if (line) {
                    if (line === '[DONE]') {
                        console.log('[DONE] received - completed');
                        // Signal completion
                        if (onChunk) {
                            onChunk({ content: '', status: 'completed' });
                        }
                    } else {
                        try {
                            const parsedChunk = JSON.parse(line);

                            // Send each valid chunk to the callback if it has actual content
                            if (parsedChunk && parsedChunk.choices && parsedChunk.choices[0].delta) {
                                const content = parsedChunk.choices[0].delta.content;
                                if (content && content.trim() !== "") {
                                    // Accumulate the content
                                    fullText += content;
                                    // Send the meaningful content chunk
                                    if (onChunk) {
                                        onChunk({ content: content, status: 'in-progress' });
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk:", e);
                        }
                    }
                }
            }
        });

        reader.on('end', () => {
            console.log("Streaming finished.");
            resolve(fullText);
        });

        reader.on('error', (err) => {
            console.error("Streaming error:", err);
            reject(err);
        });
    });
}


export default Rag;

