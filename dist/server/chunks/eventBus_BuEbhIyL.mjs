import { EventEmitter } from 'events';

const globalForEvents = globalThis;
const eventBus = globalForEvents.__activadosEmitter || new EventEmitter();
if (process.env.NODE_ENV !== "production") {
  globalForEvents.__activadosEmitter = eventBus;
}

export { eventBus as e };
