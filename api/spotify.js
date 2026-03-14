export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'no url' });

  const CLIENT_ID = '1ab4d5bf618e489495a7209e4b079477';
  const CLIENT_SECRET = '52ce9999bdcb4e7092f02096c2952cfd';

  try {
    let searchQuery = '';

    if (url.includes('spotify.com/track')) {
      const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (!match) return res.status(400).json({ error: 'bad url' });
      const trackId = match[1];

      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const track = await trackRes.json();
      searchQuery = `${track.name} ${track.artists?.[0]?.name || ''}`.trim();

    } else if (url.includes('music.apple.com')) {
      const u = new URL(url);
      const iParam = u.searchParams.get('i');
      const lastSeg = u.pathname.split('/').filter(Boolean).pop();
      const lid = iParam || (/^\d+$/.test(lastSeg) ? lastSeg : null);

      if (lid) {
        const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${lid}`);
        const lookupData = await lookupRes.json();
        if (lookupData.results?.length > 0) {
          return res.status(200).json({ track: lookupData.results[0] });
        }
      }
      const segs = u.pathname.split('/').filter(Boolean);
      for (let i = segs.length - 1; i >= 0; i--) {
        const s = segs[i];
        if (/^\d+$/.test(s) || ['album','song','artist','playlist','us','gb','ca','au'].includes(s)) continue;
        searchQuery = s.replace(/-/g, ' ');
        break;
      }
    }

    if (!searchQuery) return res.status(400).json({ error: 'no query' });

    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&entity=song&limit=1`);
    const itunesData = await itunesRes.json();

    if (itunesData.results?.length > 0) {
      return res.status(200).json({ track: itunesData.results[0] });
    }

    return res.status(404).json({ error: 'not found' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
