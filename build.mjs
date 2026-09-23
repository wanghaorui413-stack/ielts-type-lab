import { readFile, writeFile, mkdir } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const css = await readFile('dist/styles.css', 'utf8');
const js = await readFile('dist/app.js', 'utf8');
const source = await readFile('src/worker.mjs', 'utf8');
const marker = '/*__EMBED_ASSETS__*/';
if (!source.includes(marker)) throw new Error('Worker asset marker is missing');
const bundled = source.replace(marker, `const ASSETS = ${JSON.stringify({ '/': html, '/index.html': html, '/styles.css': css, '/app.js': js })};`);
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', bundled);
await mkdir('dist/.openai', { recursive: true });
await writeFile('dist/.openai/hosting.json', await readFile('.openai/hosting.json'));
