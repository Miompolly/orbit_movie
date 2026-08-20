import { Router } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = Router();

function isLocalUrl(url) {
  if (!url) return false;
  if (url.startsWith('/uploads/') || url.startsWith('/api/')) return true;
  try {
    const u = new URL(url, 'http://localhost');
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

router.get('/video', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  if (isLocalUrl(url)) {
    if (url.startsWith('/')) {
      const host = req.get('host');
      const proto = req.protocol || 'http';
      return res.redirect(302, `${proto}://${host}${url}`);
    }
    return res.redirect(302, url);
  }

  let remoteUrl;
  try {
    remoteUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const mod = remoteUrl.protocol === 'https:' ? https : http;

  try {
    const proxyReq = mod.get(remoteUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Referer': remoteUrl.origin,
      },
      timeout: 15000,
    }, (upstream) => {
      if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
        return res.redirect(302, `/api/proxy/video?url=${encodeURIComponent(upstream.headers.location)}`);
      }

      if (upstream.statusCode !== 200) {
        return res.status(upstream.statusCode).json({ error: `Upstream returned ${upstream.statusCode}` });
      }

      const contentType = upstream.headers['content-type'] || 'video/mp4';
      const contentLength = upstream.headers['content-length'];

      res.set('Content-Type', contentType);
      if (contentLength) res.set('Content-Length', contentLength);
      if (upstream.headers['content-range']) res.set('Content-Range', upstream.headers['content-range']);
      if (upstream.headers['accept-ranges']) res.set('Accept-Ranges', upstream.headers['accept-ranges']);
      res.set('Access-Control-Allow-Origin', '*');

      upstream.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Failed to fetch video' });
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) res.status(504).json({ error: 'Upstream timeout' });
    });
  } catch (err) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Proxy error' });
  }
});

export default router;
