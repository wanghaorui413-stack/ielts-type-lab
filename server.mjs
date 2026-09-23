import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(import.meta.dirname, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
createServer(async (request, response) => {
  const path = normalize(new URL(request.url, 'http://localhost').pathname).replace(/^[/\\]+/, '') || 'index.html';
  if (path.startsWith('..')) { response.writeHead(403); response.end(); return; }
  try {
    const content = await readFile(join(root, path));
    response.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8766, '127.0.0.1', () => console.log('http://127.0.0.1:8766'));
