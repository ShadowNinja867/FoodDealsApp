/**
 * OpenStreetMap (Nominatim & Overpass) — server-side only.
 * 100% Free, NO API KEY OR CREDIT CARD REQUIRED.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
// OpenStreetMap blocks generic browser UAs from scripts (403 Forbidden). We must use a descriptive Bot UA with contact info.
const USER_AGENT = 'FoodDealsApp/1.2 (Bot; contact: developer@localhost)';

const EARTH_RADIUS_MILES = 3958.8;

function haversineDistanceMiles(a, b) {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_MILES * c;
}

function haversineDistanceMeters(a, b) {
  return haversineDistanceMiles(a, b) * 1609.344;
}

function normalizeBrand(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function placeNameMatchesChain(chainTitle, displayName) {
  const c = normalizeBrand(chainTitle);
  const n = normalizeBrand(displayName);
  if (!c || !n) return false;
  return n.includes(c) || c.includes(n);
}

export async function autocompleteRestaurants(input, location, signal) {
  const q = String(input || '').trim();
  if (q.length < 2) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '10');
  
  // Bias to roughly 50km around the user's location
  if (location) {
    const offset = 0.5; // ~55km in degrees
    url.searchParams.set('viewbox', `${location.longitude - offset},${location.latitude + offset},${location.longitude + offset},${location.latitude - offset}`);
    url.searchParams.set('bounded', '1');
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal,
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(res.statusText || 'Autocomplete failed');
  }

  const suggestions = Array.isArray(json) ? json : [];
  const out = [];
  for (const s of suggestions) {
    const title = s.name || s.display_name.split(',')[0];
    const subtitle = s.display_name.replace(`${title}, `, '').trim();
    out.push({
      placeId: String(s.place_id),
      title: title,
      subtitle: subtitle,
    });
  }
  return out;
}

function buildOverpassRegex(string) {
  let s = string.trim();
  s = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
  s = s.replace(/['’`]/g, '.?'); // Optional apostrophe (e.g. McDonald's)
  s = s.replace(/!/g, '.?'); // Optional exclamation
  s = s.replace(/\\?&/g, '.*'); // Ampersand can be "and"
  s = s.replace(/\s+/g, '.*'); // Spaces can be any characters or missing
  // Replace all vowels with wildcard to seamlessly match accented characters (é, è, â, etc.) in OSM
  s = s.replace(/[aAáàâäeEéèêëiIíìîïoOóòôöuUúùûü]/g, '.');
  return s;
}

export async function resolveBranchesForChain(chainTitle, location, radiusMeters, signal) {
  const radiusMetersForBias = Math.min(radiusMeters, 50000); // Allow frontend to dictate radius
  const safeChain = buildOverpassRegex(chainTitle);

  // Overpass QL: Find any nodes/ways (nw) where name or brand matches the search within the radius. (Skipping slow relations)
  // qt: Tells the server to skip sorting by ID and just dump results instantly.
  const query = `
    [out:json][timeout:25];
    (
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["name"~"${safeChain}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["brand"~"${safeChain}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["operator"~"${safeChain}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["name"~"${safeChain}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["brand"~"${safeChain}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["operator"~"${safeChain}",i];
    );
    out center qt;
  `;

  let result = null;
  const errors = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) throw new Error('Aborted by client');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.status === 429) throw new Error(`Rate limited by ${endpoint}`);
      if (!res.ok) throw new Error(`Search failed at ${endpoint}: ${res.statusText || res.status}`);
      const data = await res.json();
      if (data.remark && data.remark.toLowerCase().includes('error')) throw new Error(data.remark);
      
      result = data;
      break; // Success! No need to try fallback endpoints.
    } catch (e) {
      if (e.name === 'AbortError') throw e; // Bubble up client disconnects immediately
      errors.push(e.message);
    }
  }

  if (!result) {
    console.error(`[placesService] Error searching "${chainTitle}":`, errors.join(' | '));
    const firstErr = errors[0] === 'fetch failed' ? 'Connection Refused (IP Ban)' : errors[0];
    throw new Error(`OpenStreetMap Error: ${firstErr || 'Timeout'}`);
  }

  const elements = Array.isArray(result.elements) ? result.elements : [];
  return elements
    .map((el) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const name = el.tags?.name || el.tags?.brand || chainTitle;
      const address = [el.tags?.['addr:street'], el.tags?.['addr:city'], el.tags?.['addr:postcode']].filter(Boolean).join(', ');
      return { id: `osm_${el.id}`, name, address, latitude: Number(lat), longitude: Number(lon) };
    })
    .filter((p) => p.id && Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .filter((p) => placeNameMatchesChain(chainTitle, p.name));
}

export async function resolveBranchesForChains(chainTitles, location, radiusMeters, signal) {
  const radiusMetersForBias = Math.min(radiusMeters, 50000);
  const validTitles = chainTitles.filter(Boolean);
  if (validTitles.length === 0) return [];

  // Combine all names into a single massive regex query like "(KFC|McDonald's|Taco Bell)"
  const safeRegex = '(' + validTitles.map(buildOverpassRegex).join('|') + ')';

  const query = `
    [out:json][timeout:60];
    (
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["name"~"${safeRegex}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["brand"~"${safeRegex}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["amenity"]["operator"~"${safeRegex}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["name"~"${safeRegex}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["brand"~"${safeRegex}",i];
      nw(around:${radiusMetersForBias},${location.latitude},${location.longitude})["shop"]["operator"~"${safeRegex}",i];
    );
    out center qt;
  `;

  let result = null;
  const errors = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) throw new Error('Aborted by client');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.status === 429) throw new Error(`Rate limited by ${endpoint}`);
      if (!res.ok) throw new Error(`Search failed at ${endpoint}: ${res.statusText || res.status}`);
      const data = await res.json();
      if (data.remark && data.remark.toLowerCase().includes('error')) throw new Error(data.remark);
      
      result = data;
      break;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      errors.push(e.message);
    }
  }

  if (!result) {
    console.error(`[placesService] Error batch searching:`, errors.join(' | '));
    const firstErr = errors[0] === 'fetch failed' ? 'Connection Refused (IP Ban)' : errors[0];
    throw new Error(`OpenStreetMap Error: ${firstErr || 'Timeout'}`);
  }

  const elements = Array.isArray(result.elements) ? result.elements : [];
  return elements
    .map((el) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const name = el.tags?.name || el.tags?.brand || el.tags?.operator || '';
      const address = [el.tags?.['addr:street'], el.tags?.['addr:city'], el.tags?.['addr:postcode']].filter(Boolean).join(', ');
      return { id: `osm_${el.id}`, name, address, latitude: Number(lat), longitude: Number(lon) };
    })
    .filter((p) => p.id && Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .map((p) => {
      // Attach the original requested chain title to the result so the frontend knows which partner this belongs to!
      const matchedChain = validTitles.find((t) => placeNameMatchesChain(t, p.name));
      if (matchedChain) return { ...p, matchedChain };
      return null;
    })
    .filter(Boolean);
}
