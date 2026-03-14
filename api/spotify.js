export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'no url' });

  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)',
      }
    });

    if (!response.ok) return res.status(502).json({ error: 'spotify failed' });

    const data = await response.json();
    return res.status(200).json({ title: data.title || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
