import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';
import { getPublicUrl } from '../config/publicUrl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const videoFilter = (_req, file, cb) => {
  const allowed = /mp4|webm|ogg|mov|mkv/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype.startsWith('video/');
  cb(null, ext || mime);
};

const imageFilter = (_req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = file.mimetype.startsWith('image/');
  cb(null, ext || mime);
};

const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});

const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.post('/video', requireAdmin, (req, res) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Max 2GB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }
    const local = `/uploads/${req.file.filename}`;
    const publicUrl = getPublicUrl();
    const url = publicUrl ? `${publicUrl}${local}` : local;
    res.status(201).json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      originalName: req.file.originalname
    });
  });
});

router.post('/image', requireAdmin, (req, res) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Max 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const local = `/uploads/${req.file.filename}`;
    const publicUrl = getPublicUrl();
    const url = publicUrl ? `${publicUrl}${local}` : local;
    res.status(201).json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      originalName: req.file.originalname
    });
  });
});

export default router;
