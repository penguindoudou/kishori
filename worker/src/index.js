const ALLOWED_ORIGINS = [
  'https://kishori.se',
  'https://www.kishori.se',
  'http://localhost:4000', // local Jekyll dev
  'http://127.0.0.1:4000',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, allowed ? origin : '');
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, origin);
    }

    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return corsResponse(JSON.stringify({ error: 'Missing required fields' }), 400, origin);
    }

    const text =
      `📬 *Ny bokningsförfrågan*\n\n` +
      `👤 *Namn:* ${escape(name)}\n` +
      `📧 *E\\-post:* ${escape(email)}\n` +
      `📞 *Telefon:* ${escape(phone || '—')}\n` +
      `💬 *Meddelande:*\n${escape(message)}`;

    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`;

    const tgRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'MarkdownV2',
      }),
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram error:', err);
      return corsResponse(JSON.stringify({ error: 'Failed to send message' }), 502, origin);
    }

    return corsResponse(JSON.stringify({ ok: true }), 200, origin);
  },
};

// Escape MarkdownV2 special chars
function escape(str) {
  return String(str).replace(/[_*[\]()~`>#+=|{}.!\-]/g, '\\$&');
}

function corsResponse(body, status, origin) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  return new Response(body, { status, headers });
}
