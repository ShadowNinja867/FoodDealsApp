#!/usr/bin/env node
/**
 * Picks a LAN IPv4 for Metro that phones can reach.
 * Excludes iCloud Private Relay-style 192.0.0.0/24 (Expo's lan-network wrongly prefers it).
 */
const os = require('os');

function isExcluded(ip) {
  if (!ip || typeof ip !== 'string') return true;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('169.254.')) return true;
  // RFC 6333 / Apple: not a real LAN address your phone can route to
  if (ip.startsWith('192.0.0.')) return true;
  return false;
}

function score(ip) {
  if (ip.startsWith('192.168.')) return 100;
  if (ip.startsWith('10.')) return 85;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return 80;
  }
  // Tailscale / CGNAT
  const m2 = ip.match(/^100\.(\d+)\./);
  if (m2) {
    const n2 = Number(m2[1]);
    if (n2 >= 64 && n2 <= 127) return 55;
  }
  return 5;
}

const candidates = [];
try {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const addr of nets[name] || []) {
      const fam = addr.family;
      if (fam !== 'IPv4' && fam !== 4) continue;
      if (addr.internal) continue;
      const ip = addr.address;
      if (isExcluded(ip)) continue;
      candidates.push({ ip, score: score(ip), name });
    }
  }
} catch {
  process.exit(1);
}

candidates.sort((a, b) => b.score - a.score || a.ip.localeCompare(b.ip));

if (!candidates.length) {
  process.exit(1);
}

process.stdout.write(candidates[0].ip);
