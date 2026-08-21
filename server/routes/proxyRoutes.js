import { Router } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { proxyLimiter } from '../middleware/rateLimit.js';

const router = Router();

const ALLOWED_HOSTS = [
  'commondatastorage.googleapis.com',
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  'image.tmdb.org',
  'www.youtube.com',
  'i.ytimg.com',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'cloudinary.com',
  'amazonaws.com',
  'cloudfront.net',
  'blob.core.windows.net',
  'digitaloceanspaces.com',
  'backblazeb2.com',
  'b-cdn.net',
  'mux.com',
  'wasabisys.com',
  'supabase.co',
  'dl.dropboxusercontent.com',
];

const envHosts = (process.env.PROXY_ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);
envHosts.forEach((h) => {
  if (!ALLOWED_HOSTS.includes(h)) ALLOWED_HOSTS.push(h);
});

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

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

function fetchVideo(remoteUrl, req, res, redirects = 0) {
  if (redirects > 5) {
    return res.status(508).json({ error: 'Too many redirects' });
  }

  const mod = remoteUrl.protocol === 'https:' ? https : http;
  const upstreamHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
    'Referer': remoteUrl.origin,
  };
  if (req.headers.range) {
    upstreamHeaders['Range'] = req.headers.range;
  }

  const proxyReq = mod.get(remoteUrl.href, {
    headers: upstreamHeaders,
    timeout: 30000,
  }, (upstream) => {
    if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      let nextUrl = upstream.headers.location;
      try {
        if (nextUrl.startsWith('/')) {
          nextUrl = `${remoteUrl.protocol}//${remoteUrl.host}${nextUrl}`;
        }
        return fetchVideo(new URL(nextUrl), req, res, redirects + 1);
      } catch {
        return res.status(502).json({ error: 'Bad redirect URL' });
      }
    }

    if (upstream.statusCode !== 200 && upstream.statusCode !== 206) {
      return res.status(upstream.statusCode).json({ error: `Upstream returned ${upstream.statusCode}` });
    }

    const contentType = upstream.headers['content-type'] || 'video/mp4';
    const contentLength = upstream.headers['content-length'];

    res.status(upstream.statusCode);
    res.set('Content-Type', contentType);
    if (contentLength) res.set('Content-Length', contentLength);
    if (upstream.headers['content-range']) res.set('Content-Range', upstream.headers['content-range']);
    if (upstream.headers['accept-ranges']) res.set('Accept-Ranges', upstream.headers['accept-ranges']);
    else res.set('Accept-Ranges', 'bytes');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Range');
    res.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

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
}

router.get('/video', proxyLimiter, (req, res) => {
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

  if (!isAllowedHost(remoteUrl.hostname)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  fetchVideo(remoteUrl, req, res);
});

export default router;
