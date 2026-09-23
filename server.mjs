import { createServer } from 'node:http';
import worker from './dist/server/index.js';

// Local preview keeps its own short-lived data; hosted data lives in D1.
const metrics = new Map();
const feedback = [];
const DB = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async run() {
            if (sql.startsWith('INSERT INTO daily_metrics')) {
              const key = `${values[0]}:${values[1]}`;
              metrics.set(key, (metrics.get(key) || 0) + 1);
            } else if (sql.startsWith('INSERT INTO feedback')) {
              feedback.push(values);
              console.log(`Local feedback saved (${feedback.length} total)`);
            } else throw new Error('Unsupported local database query');
            return { success: true };
          },
        };
      },
    };
  },
};

createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const url = new URL(incoming.url, 'http://127.0.0.1:8766');
    const request = new Request(url, { method: incoming.method, headers: incoming.headers, body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : body });
    const response = await worker.fetch(request, { DB });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(incoming.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500); outgoing.end('Local preview error');
  }
}).listen(8766, '127.0.0.1', () => console.log('http://127.0.0.1:8766'));
