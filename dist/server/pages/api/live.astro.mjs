import { e as eventBus } from '../../chunks/eventBus_BuEbhIyL.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  let isClosed = false;
  let interval;
  let notify;
  const stream = new ReadableStream({
    start(controller) {
      notify = () => {
        if (isClosed) return;
        try {
          controller.enqueue("data: update\n\n");
        } catch (e) {
        }
      };
      eventBus.on("data-changed", notify);
      interval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(":\n\n");
        } catch (e) {
        }
      }, 15e3);
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        eventBus.off("data-changed", notify);
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
        }
      });
    },
    cancel() {
      isClosed = true;
      eventBus.off("data-changed", notify);
      clearInterval(interval);
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
