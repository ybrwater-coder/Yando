const UPSTASH_URL = 'https://set-hen-71673.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAARf5AAIncDFlNTI4Nzg0ZTU0OTY0MzBjOGFkOWU1MzczNDNkOGU5ZnAxNzE2NzM';

async function redis(cmd) {
  const r = await fetch(`${UPSTASH_URL}/${cmd.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  if (req.method === 'POST') {
    const msg = req.body;
    await redis(['rpush', 'messages', JSON.stringify(msg)]);
    await redis(['ltrim', 'messages', '-200', '-1']);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const since = req.query.since || '0';
    const data = await redis(['lrange', 'messages', since, '-1']);
    return res.status(200).json({ messages: data.result || [] });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
