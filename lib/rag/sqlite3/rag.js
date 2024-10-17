require('dotenv').config();
const OpenAI = require('openai');
import fetch from 'node-fetch';
import { Readable } from 'stream';
const readline = require('readline');
const fs = require('fs');
const db = require('@/lib/services/sql');
const utils = require('@/lib/utils/schemaUtils');
const defaultInstructions = require("@/lib/constants/instructions")

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const provider = 'openrouter';
//const defaultModel = 'google/gemini-flash-1.5'
//const simpleModel = 'google/gemini-pro-1.5-exp';
const simpleModel = 'google/gemini-flash-1.5'
//const simpleModel = 'anthropic/claude-3-haiku'
//const defaultModel = 'anthropic/claude-3-haiku'

//const defaultModel = 'openai/gpt-4o-mini'
//const simpleModel = 'google/gemini-pro-1.5';
//const defaultModel = 'anthropic/claude-3-haiku' //'gpt-4o-mini' ''
//const defaultModel = 'anthropic/claude-3.5-sonnet:beta';
const defaultModel = 'openai/gpt-4o-mini'
//const defaultModel = 'openai/gpt-4o-mini'
//const defaultModel = 'google/gemini-pro-1.5-exp';
//const defaultModel = 'google/gemini-pro-1.5'
//const defaultModel = 'google/gemini-flash-1.5'
//const defaultModel = 'qwen/qwen-2.5-72b-instruct' //'gpt-4o-mini' ''
//const defaultModel = 'openai/gpt-4o-2024-08-06'
const advancedModel = ['anthropic/claude-3.5-sonnet:beta', 'openai/gpt-4o-2024-08-06']
const maxTokens = 10000;


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

    async createExamples(instructions, schema, data, model) {
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
        let text = formattedResponse.choices[0].message.content.trim();
        text = processCode(text, 'json', 'extract');
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


    async translateStreaming(query, instructions, data, model, streamCallbacks) {
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
            stream: true,
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

        try {
            await processStreamingResponse(response, streamCallbacks, model);
        } catch (error) {
            console.error("Error in translateStreaming:", error);
            throw error;
        }
    }


    async chatStreaming(userQuery, userChat, dbResult, messages, instructions, model, streamCallbacks) {
        // Set default instructions if none are provided
        if (!instructions) {
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = defaultInstructions.chatInstructions;
        }

        // Construct the AI content payload
        let aiContent = {
            model: simpleModel,
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

        try {
            await processStreamingResponse(response, streamCallbacks, model);
        } catch (error) {
            console.error("Error in chatStreaming:", error);
            throw error;
        }
    }



    async queryStreaming(userQuery, annotation, model, instructions, schema, generate, streamCallbacks, parallelRequeries = 5) {
        // Fetch all queries from the database
        let queries = db.query(this.username, this.dbName, 'SELECT * FROM queries');

        if (!generate) {
            // no generative flow - simple query workflow
            try {
                let response = await this.#queryWorkflow(userQuery, annotation, queries, model, instructions, schema, false, null, streamCallbacks);
                
                // Send the 'query-executed' status
                if (streamCallbacks && streamCallbacks.onQueryExecuted) {
                    streamCallbacks.onQueryExecuted(response);
                }
                // Send the 'completed' status
                if (streamCallbacks && streamCallbacks.onCompleted) {
                    streamCallbacks.onCompleted();
                }
            } catch (error) {
                if (streamCallbacks && streamCallbacks.onError) {
                    streamCallbacks.onError(error.toString());
                }
            }
        }
        else {
            // Generation mode - more complex flow

            let responses = []; // Array to hold responses

            // Create parallel promises for both initial query workflow and requery workflow
            const queryPromises = [];

            for (let i = 0; i < parallelRequeries; i++) {
                // Omit onChunk when calling queryWorkflow
                queryPromises.push(this.#queryWorkflow(userQuery, annotation, queries, model, instructions, schema, false, null));
            }

            // Execute all attempts in parallel
            responses = await Promise.all(queryPromises);

            // Pass streamCallbacks to chooseQuery
            let chosenSQL = await this.#chooseQuery(userQuery, annotation, queries, model, schema, responses, streamCallbacks);
            let result = [];
            try {
                result = db.query(this.username, this.dbName, chosenSQL.sql);
                const finalResult = { query: chosenSQL.sql, chat: chosenSQL.chat, data: result, error: null };
                
                // Send the 'query-executed' status
                if (streamCallbacks && streamCallbacks.onQueryExecuted) {
                    console.log('Calling onQueryExecuted with finalResult:', finalResult);
                    streamCallbacks.onQueryExecuted(finalResult);
                }
                // Send the 'completed' status
                if (streamCallbacks && streamCallbacks.onCompleted) {
                    streamCallbacks.onCompleted();
                }
                return finalResult;
            } catch (ex) {
                console.log(ex);
                const errorResult = { query: chosenSQL.sql, chat: chosenSQL.chat, data: null, error: ex };
                if (streamCallbacks && streamCallbacks.onProgress) {
                    streamCallbacks.onProgress(JSON.stringify(errorResult));
                }
                if (streamCallbacks && streamCallbacks.onCompleted) {
                    streamCallbacks.onCompleted();
                }
                return errorResult;
            }
        }
    }


    async #queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, requery, previousEx, streamCallbacks = null) {
        // Log the current workflow status
        console.log(requery ? 'Performing requery workflow' : 'Performing initial query workflow');

        let dbQuery;

        if (requery) {
            // Requery workflow: regenerate the database query based on the failed query
            // Fetch updated instructions for requery
            instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
            instructions = JSON.parse(instructions[0]).requeryInstructions;

            // Regenerate the database query with the failed query as context
            dbQuery = await this.#regenerateDBQuery(naturalLanguageQuery, annotation, queries, previousEx.query, model, instructions, schema, previousEx.error, streamCallbacks);
        } else {
            // Initial query workflow: generate the initial database query
            if (!instructions) {
                instructions = db.query(this.username, this.dbName, 'SELECT * FROM instructions', null, true);
                instructions = JSON.parse(instructions[0]).queryInstructions;
            }
            dbQuery = await this.#generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema, streamCallbacks);

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

            // Send the execution result back via streamCallbacks
            if (streamCallbacks && streamCallbacks.onProgress) {
                streamCallbacks.onProgress(JSON.stringify({ query: dbQuery.query, data: result }));
            }

            return { query: dbQuery.query, chat: dbQuery.chat, data: result, error: null };
        } catch (ex) {
            console.log(ex);
            // Determine whether to retry based on the current workflow and previous exception
            if (!requery || (requery && !previousEx)) {
                // If not in a requery workflow or in a requery workflow without a previous exception, retry
                return await this.#queryWorkflow(naturalLanguageQuery, annotation, queries, model, instructions, schema, true, { query: dbQuery.query, error: ex }, streamCallbacks);
            } else {
                // If already in a requery workflow with a previous exception, do not retry and return the error
                return { query: dbQuery.query, chat: dbQuery.chat, data: null, error: ex };
            }
        }
    }



    async #chooseQuery(naturalLanguageQuery, annotation, queries, model, schema, responses, streamCallbacks) {
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

            // Use processStreamingResponse instead of manual streaming handling
            let fullText = await processStreamingResponse(response, streamCallbacks, model);

            // Process the accumulated fullText
            let text = cleanupText(fullText);
            console.log(text);
            let sql = processCode(text, 'sql', 'extract');

            return { sql: sql, chat: text };
        }
    }

    async #generateDBQuery(naturalLanguageQuery, annotation, queries, model, instructions, schema, streamCallbacks) {
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
            let fullText = await processStreamingResponse(response, streamCallbacks, model);

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


    async #regenerateDBQuery(naturalLanguageQuery, annotation, queries, previousQuery, model, instructions, schema, ex, streamCallbacks) {
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
            let fullText = await processStreamingResponse(response, streamCallbacks, model);

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

async function processStreamingResponse(response, streamCallbacks, model) {
    let fullText = '';
    let buffer = '';

    try {
        for await (const chunk of response.body) {
            const text = new TextDecoder().decode(chunk);
            buffer += text;

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const content = line.slice(6).trim();
                    if (content === '[DONE]') {
                        if (streamCallbacks && streamCallbacks.onCompleted) {
                            streamCallbacks.onCompleted();
                        }
                        return fullText;
                    }
                    try {
                        const parsed = JSON.parse(content);
                        const chunkContent = parsed.choices[0].delta.content || '';
                        if (chunkContent) {
                            if (streamCallbacks && streamCallbacks.onProgress) {
                                streamCallbacks.onProgress(chunkContent);
                            }
                            fullText += chunkContent;
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        }

        // Process any remaining content in the buffer
        if (buffer) {
            if (streamCallbacks && streamCallbacks.onProgress) {
                streamCallbacks.onProgress(buffer);
            }
            fullText += buffer;
        }
        if (streamCallbacks && streamCallbacks.onCompleted) {
            streamCallbacks.onCompleted();
        }

        return fullText;
    } catch (error) {
        console.error("Streaming error:", error);
        if (streamCallbacks && streamCallbacks.onError) {
            streamCallbacks.onError(error);
        }
        throw error;
    }
}


export default Rag;


