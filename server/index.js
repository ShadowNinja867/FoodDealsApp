import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { readDeals, writeDeals } from './dealsStore.js';
import { autocompleteRestaurants, resolveBranchesForChain } from './placesService.js';

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) {
  console.warn('[fooddeals-api] WARNING: GOOGLE_PLACES_API_KEY is not set. Places routes will fail.');
}

const app = express();
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'fooddeals-api' });
});

app.post('/api/places/autocomplete', async (req, res) => {
  try {
    const { input, location } = req.body || {};
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      res.status(400).json({ error: 'location { latitude, longitude } required' });
      return;
    }
    const ac = new AbortController();
    const list = await autocompleteRestaurants(String(input || ''), location, ac.signal);
    res.json({ suggestions: list });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'autocomplete failed' });
  }
});

app.post('/api/places/branches', async (req, res) => {
  try {
    const { chainTitle, location, radiusMeters } = req.body || {};
    if (!chainTitle || typeof chainTitle !== 'string') {
      res.status(400).json({ error: 'chainTitle required' });
      return;
    }
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      res.status(400).json({ error: 'location { latitude, longitude } required' });
      return;
    }
    const radius = typeof radiusMeters === 'number' && radiusMeters > 0 ? radiusMeters : 8046;
    const ac = new AbortController();
    const branches = await resolveBranchesForChain(chainTitle.trim(), location, radius, ac.signal);
    res.json({ branches });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'branches failed' });
  }
});

app.get('/api/deals', async (_req, res) => {
  try {
    const deals = await readDeals();
    res.json({ deals });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'read failed' });
  }
});

app.put('/api/deals', async (req, res) => {
  try {
    const { deals } = req.body || {};
    if (!Array.isArray(deals)) {
      res.status(400).json({ error: 'body.deals must be an array' });
      return;
    }
    await writeDeals(deals);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'write failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[fooddeals-api] listening on http://0.0.0.0:${PORT}`);
});
