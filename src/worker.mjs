/*__EMBED_ASSETS__*/

const events = new Set(['page_view', 'mode_essay', 'mode_copy', 'mode_game', 'practice_start', 'practice_complete', 'feedback_open', 'feedback_submit']);
const categories = new Set(['bug', 'idea', 'other']);

function responseJson(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}

async function readJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('content_type');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  let size = 0;
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function db(env) {
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  return env.DB;
}

async function track(request, env) {
  let body;
  try { body = await readJson(request); } catch { return responseJson({ error: 'invalid_request' }, 400); }
  if (!body || !events.has(body.event)) return responseJson({ error: 'invalid_event' }, 400);
  const now = new Date();
  const day = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    await db(env).prepare('INSERT INTO daily_metrics (day, event, count) VALUES (?, ?, 1) ON CONFLICT(day, event) DO UPDATE SET count = count + 1').bind(day, body.event).run();
    return responseJson({ ok: true });
  } catch (error) { console.error('track failed', error); return responseJson({ error: 'temporarily_unavailable' }, 503); }
}

async function submitFeedback(request, env) {
  let body;
  try { body = await readJson(request); } catch { return responseJson({ error: 'invalid_request' }, 400); }
  const category = body?.category;
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (body?.website) return responseJson({ ok: true });
  if (!categories.has(category) || message.length < 10 || message.length > 1000) return responseJson({ error: 'invalid_feedback' }, 400);
  try {
    await db(env).prepare('INSERT INTO feedback (created_at, category, message) VALUES (?, ?, ?)').bind(new Date().toISOString(), category, message).run();
    return responseJson({ ok: true }, 201);
  } catch (error) { console.error('feedback failed', error); return responseJson({ error: 'temporarily_unavailable' }, 503); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'POST') return responseJson({ error: 'method_not_allowed' }, 405);
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return responseJson({ error: 'forbidden' }, 403);
      if (url.pathname === '/api/track') return track(request, env);
      if (url.pathname === '/api/feedback') return submitFeedback(request, env);
      return responseJson({ error: 'not_found' }, 404);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const asset = ASSETS[url.pathname];
    if (asset === undefined) return new Response('Not found', { status: 404 });
    const type = url.pathname.endsWith('.css') ? 'text/css' : url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html';
    return new Response(request.method === 'HEAD' ? null : asset, { headers: {
      'content-type': `${type}; charset=utf-8`,
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    } });
  },
};
