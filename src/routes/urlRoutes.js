import express from 'express';
import { nanoid } from 'nanoid';
import Url from '../models/Url.js';

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// POST /shorten
router.post('/shorten', async (req, res) => {
  const { url, expiresAt } = req.body;

  try {
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const shortCode = nanoid(6);

    const newUrl = await Url.create({
      originalUrl: url,
      shortCode,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.json({ shortUrl: `${BASE_URL}/${shortCode}` });
  } catch (err) {
    console.error('Error in /shorten:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const found = await Url.findOne({ shortCode: code });

    if (!found) return res.status(404).send('Short URL not found');

    // Expiry check
    if (found.expiresAt && new Date() > found.expiresAt) {
      return res.status(410).send('URL has expired');
    }

    // Track click
    found.clicks++;
    await found.save();

    res.redirect(found.originalUrl);
  } catch (err) {
    console.error('Error in redirect:', err);
    res.status(500).send('Server error');
  }
});

export default router;
