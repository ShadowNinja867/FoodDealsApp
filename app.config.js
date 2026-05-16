/* eslint-env node */
/**
 * Loads `.env` and optional `local.keys.json` for the public API base URL only.
 * Google keys live on the server (server/.env → GOOGLE_PLACES_API_KEY), never in the app.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');

let fileExtra = {};
try {
  const keysPath = path.resolve(__dirname, 'local.keys.json');
  if (fs.existsSync(keysPath)) {
    fileExtra = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  }
} catch {
  /* ignore */
}

const envBase = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
const fileBase = String(fileExtra.apiBaseUrl || '').trim();

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      apiBaseUrl: envBase || fileBase,
    },
  },
});
