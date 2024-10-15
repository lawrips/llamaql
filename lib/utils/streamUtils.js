const encoder = new TextEncoder();

export function createStreamResponse(streamLogic, waitForQueryExecution = false) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        let isStreamClosed = false;
        let queryExecutedPromise = null;
        let resolveQueryExecuted = null;
        
        const streamHandler = ({ content, status }) => {
          if (isStreamClosed) return;
          const chunk = JSON.stringify({ content, status });
          //console.log('Sending chunk:', chunk);
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        };

        const closeStream = () => {
          if (!isStreamClosed) {
            isStreamClosed = true;
            controller.close();
          }
        };

        const streamCallbacks = {
          onProgress: (content) => streamHandler({ content, status: 'in-progress' }),
          onQueryExecuted: (result) => {
            streamHandler({ content: JSON.stringify(result), status: 'query-executed' });
            if (resolveQueryExecuted) resolveQueryExecuted();
          },
          onCompleted: async () => {
            if (waitForQueryExecution && queryExecutedPromise) {
              await queryExecutedPromise;
            }
            streamHandler({ content: '', status: 'completed' });
            closeStream();
          },
          onError: (error) => {
            streamHandler({ content: error.toString(), status: 'error' });
            closeStream();
          }
        };

        try {
          if (waitForQueryExecution) {
            queryExecutedPromise = new Promise(resolve => {
              resolveQueryExecuted = resolve;
            });
          }

          await streamLogic(streamHandler, streamCallbacks);
          
          // If onQueryExecuted was never called but we were waiting for it, resolve the promise
          if (waitForQueryExecution && resolveQueryExecuted) {
            resolveQueryExecuted();
          }

          // Ensure the stream is closed if onCompleted wasn't called
          closeStream();
        } catch (error) {
          console.error('Stream logic error:', error);
          streamCallbacks.onError(error);
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    }
  );
}
