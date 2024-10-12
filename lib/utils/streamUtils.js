const encoder = new TextEncoder();

export function createStreamResponse(streamLogic) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        let queryExecutedPromise = null;
        let resolveQueryExecuted = null;
        
        const streamHandler = ({ content, status }) => {
          const chunk = JSON.stringify({ content, status });
          console.log('Sending chunk:', chunk);
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        };

        const streamCallbacks = {
          onProgress: (content) => streamHandler({ content, status: 'in-progress' }),
          onQueryExecuted: (result) => {
            console.log('Query executed, sending result:', result);
            streamHandler({ content: JSON.stringify(result), status: 'query-executed' });
            if (resolveQueryExecuted) resolveQueryExecuted();
          },
          onCompleted: async () => {
            if (queryExecutedPromise) {
              await queryExecutedPromise;
            }
            streamHandler({ content: '', status: 'completed' });
            controller.close();
          },
          onError: (error) => {
            streamHandler({ content: error.toString(), status: 'error' });
            controller.close();
          }
        };

        try {
          queryExecutedPromise = new Promise(resolve => {
            resolveQueryExecuted = resolve;
          });

          await streamLogic(streamHandler, streamCallbacks);
          
          // If onQueryExecuted was never called, resolve the promise
          if (resolveQueryExecuted) {
            resolveQueryExecuted();
          }
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
