import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Rag from '@/lib/rag/sqlite3/rag';
const utils = require('@/lib/utils/shareUtils');
const schemaUtils = require('@/lib/utils/schemaUtils');
const conversations = require('@/lib/utils/converastionsUtils');

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  console.log("****** NEW QUERY REQUEST ******** ");

  const body = await request.json();
  let input = body.input;
  let annotation = body.annotation;
  let instructions = body.instructions;
  let schema = body.schema;
  let generate = body.generate;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model');

  let { dbName, user: email } = utils.getShared(id) || { dbName: id, user: session.user.email };

  // reset message history
  conversations.deleteAll(dbName, session.user.email);

  const rag = new Rag(email, dbName);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let controllerClosed = false;

      const onChunk = ({ content, status }) => {
        if (controllerClosed) return;
        const chunk = JSON.stringify({ content, status });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));

        // Close the controller only when appropriate
        if (status === 'query-executed' || status === 'error') {
          if (!controllerClosed) {
            controller.close();
            controllerClosed = true;
          }
        }
      };

      try {
        await rag.queryStreaming(input, annotation, model, instructions, schema, generate || null, onChunk);

        // Only send this if rag.queryStreaming didn't send a 'query-executed' status
        if (!controllerClosed) {
          const finalResultChunk = JSON.stringify({ status: 'query-executed', content: '' });
          controller.enqueue(encoder.encode(`data: ${finalResultChunk}\n\n`));
          controller.close();
          controllerClosed = true;
        }
      } catch (error) {
        console.error(error);
        const errorChunk = JSON.stringify({ error: error.toString(), status: 'error' });
        controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`));
        if (!controllerClosed) {
          controller.close();
          controllerClosed = true;
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
