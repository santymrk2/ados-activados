import type { APIRoute } from 'astro';
import { eventBus } from '../../lib/eventBus';

export const GET: APIRoute = async ({ request }) => {
  let isClosed = false;
  let interval: any;
  let notify: () => void;

  const stream = new ReadableStream({
    start(controller) {
      notify = () => {
        if (isClosed) return;
        try {
          controller.enqueue('data: update\n\n');
        } catch (e) {
          // Ignore closed controller errors
        }
      };

      eventBus.on('data-changed', notify);

      // Ping periodically to keep connection alive
      interval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(':\n\n');
        } catch (e) {
          // Ignore
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        isClosed = true;
        eventBus.off('data-changed', notify);
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Ignore
        }
      });
    },
    cancel() {
      isClosed = true;
      eventBus.off('data-changed', notify);
      clearInterval(interval);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
};
