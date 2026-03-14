export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'no url' });

  const CLIENT_ID = '1ab4d5bf618e489495a7209e4b079477';
  const CLIENT_SECRET = '52ce9999bdcb4e7092f02096c2952cfd';

  try {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (!match) return res.status(400).json({ error: 'not a track url' });
    const trackId = match[1];

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenRes.ok) return res.status(502).json({ error: 'token failed' });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!trackRes.ok) return res.status(502).json({ error: 'track fetch failed' });
    const track = await trackRes.json();

    const title = track.name;
    const artist = track.artists?.[0]?.name || '';

    return res.status(200).json({ title: `${title} ${artist}`.trim() });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
