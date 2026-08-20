import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import movieRoutes from './movieRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import cartRoutes from './cartRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import proxyRoutes from './proxyRoutes.js';
import contactRoutes from './contactRoutes.js';
import { ADMIN_SEED, RWANDA_DISTRICTS, SELLER_PAYMENTS } from '../config/constants.js';
import { MovieModel } from '../models/Movie.js';
import { CommentModel } from '../models/Comment.js';
import { getPublicUrl } from '../config/publicUrl.js';

const SITE_URL = 'https://movieexchange.com';

const router = Router();
router.get('/health', (_req, res) => res.json({ ok: true, service: 'easter-stream-api', publicUrl: getPublicUrl() }));
router.get('/config', (_req, res) =>
  res.json({
    districts: RWANDA_DISTRICTS,
    payments: SELLER_PAYMENTS,
    adminEmail: ADMIN_SEED.email,
    publicUrl: getPublicUrl()
  })
);

router.get('/sitemap.xml', async (_req, res) => {
  const movies = await MovieModel.all();
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/movies', changefreq: 'daily', priority: '0.9' },
    { url: '/series', changefreq: 'daily', priority: '0.9' },
    { url: '/music', changefreq: 'weekly', priority: '0.7' },
    { url: '/watchlist', changefreq: 'monthly', priority: '0.5' },
    { url: '/login', changefreq: 'monthly', priority: '0.3' },
    { url: '/register', changefreq: 'monthly', priority: '0.3' }
  ];

  const moviePages = movies.map((m) => ({
    url: `/movie/${m.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: m.release_date || today
  }));

  const allPages = [...staticPages, ...moviePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((p) => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>` : ''}  </url>`).join('\n')}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/movies', movieRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/upload', uploadRoutes);
router.use('/proxy', proxyRoutes);
router.use('/contact', contactRoutes);

router.get('/comments', async (_req, res) => {
  const comments = await CommentModel.all();
  res.json(comments);
});

export default router;
