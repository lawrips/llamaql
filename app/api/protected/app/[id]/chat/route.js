import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');
const conversations = require('@/lib/utils/converastionsUtils');
import { v4 as uuidv4 } from 'uuid';
const defaultInstructions = require('@/lib/constants/instructions');


const jobs = {}; // In-memory storage for simplicity; replace with persistent storage as needed

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  let userQuery = body.userQuery;
  let userChat = body.userChat;
  let dbQuery = body.dbQuery;
  let dbResult = body.dbResult;
  let chatResult = body.chatResult;
  let instructions = body.instructions;
  const { id } = params;

  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  console.log("****** NEW CHAT REQUEST ******** ");
  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  // Add this conversation to the history
  let history = conversations.getAll(dbName, session.user.email);

  const rag = new Rag(email, dbName);

  // Create a new jobId
  const jobId = uuidv4();

  // Store the job information
  jobs[jobId] = {
    session, userQuery, userChat, dbResult, history, instructions, model,
    result: '', status: 'in-progress'
  };

  if (userChat == '/chart') {
    userChat = defaultInstructions.chartInstructions;
  }
  else if (dbResult.length == 1) {
    instructions = defaultInstructions.chatInstructions;
  }
  else if (dbResult.length > 1) {
    instructions = defaultInstructions.multiChatInstructions;
  }

  // Start the chat asynchronously with streaming
  (async () => {
    try {
      await rag.chatStreaming(userQuery, userChat, dbResult, history, instructions, model, (chunk) => {
        jobs[jobId].result += chunk.content; // Append each chunk to the result
        jobs[jobId].status = chunk.status; // Status can be in-progress or completed
        if (jobs[jobId].status == 'completed') {
          // store the conversation history
          conversations.add(dbName, session.user.email, dbQuery, dbResult, userChat, jobs[jobId].result);
        }
      });
    } catch (error) {
      jobs[jobId].status = 'failed: ' + error.message;
    }
  })();

  

  // Respond with jobId
  return new Response(
    JSON.stringify({ jobId }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}


export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobs[jobId]) {
    return new Response(
      JSON.stringify({ error: 'Invalid job ID' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream data while the job is in-progress or already completed
        while (jobs[jobId].status === 'in-progress' || jobs[jobId].status === 'completed') {
          if (jobs[jobId].result) {
            // Send all accumulated data and then clear it
            controller.enqueue(`data: ${JSON.stringify({ chunk: jobs[jobId].result })}\n\n`);
            jobs[jobId].result = ''; // Clear the result once sent
          }

          // If the job is completed, break the loop and send the final status
          if (jobs[jobId].status === 'completed') {
            controller.enqueue(`data: ${JSON.stringify({ status: 'completed' })}\n\n`);
            break;
          }

          // Wait for a short interval before checking again (if still in-progress)
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms polling interval
        }

        // If the job failed, send the failure status
        if (jobs[jobId].status.startsWith('failed')) {
          controller.enqueue(`data: ${JSON.stringify({ status: 'failed', error: jobs[jobId].status })}\n\n`);
        }

        controller.close();
      } catch (error) {
        controller.enqueue(`data: {"error": "An error occurred during streaming"}\n\n`);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
