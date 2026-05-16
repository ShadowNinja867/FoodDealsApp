import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DEALS_PATH = path.join(DATA_DIR, 'deals.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDeals() {
  try {
    const raw = await fs.readFile(DEALS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeDeals(deals) {
  await ensureDataDir();
  await fs.writeFile(DEALS_PATH, JSON.stringify(Array.isArray(deals) ? deals : [], null, 2), 'utf8');
}
