/**
 * Google Places API (New) — server-side only. Uses GOOGLE_PLACES_API_KEY from environment.
 */

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const SEARCH_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const AUTOCOMPLETE_FIELD_MASK =
  'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat';

const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location';

const NEARBY_FOOD_TYPES = [
  'restaurant',
  'fast_food_restaurant',
  'meal_takeaway',
  'cafe',
  'coffee_shop',
  'bakery',
];

function getApiKey() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  return typeof k === 'string' ? k.trim() : '';
}

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
  const key = getApiKey();
  if (!key) throw new Error('Server missing GOOGLE_PLACES_API_KEY');
  const q = String(input || '').trim();
  if (q.length < 2) return [];

  const body = {
    input: q,
    locationBias: {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius: 50000,
      },
    },
  };

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': AUTOCOMPLETE_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText || 'Autocomplete failed';
    throw new Error(msg);
  }

  const suggestions = Array.isArray(json.suggestions) ? json.suggestions : [];
  const out = [];
  for (const s of suggestions) {
    const p = s.placePrediction;
    if (!p?.placeId) continue;
    const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? '';
    const sub = p.structuredFormat?.secondaryText?.text ?? '';
    out.push({
      placeId: p.placeId,
      title: main || p.text?.text || 'Place',
      subtitle: sub,
    });
  }
  return out;
}

async function searchNearbyBranches(textQuery, location, radiusMeters, signal) {
  const key = getApiKey();
  if (!key) throw new Error('Server missing GOOGLE_PLACES_API_KEY');

  const radiusMetersForBias = Math.min(radiusMeters, 50000);
  const maxPages = 3;
  const all = [];
  let pageToken = undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const body = {
      textQuery: textQuery.trim(),
      pageSize: 20,
    };
    if (radiusMeters <= 50000) {
      body.locationBias = {
        circle: {
          center: { latitude: location.latitude, longitude: location.longitude },
          radius: radiusMetersForBias,
        },
      };
    }
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(SEARCH_TEXT_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || res.statusText || 'Search failed';
      throw new Error(msg);
    }

    const places = Array.isArray(json.places) ? json.places : [];
    for (const pl of places) {
      const id = pl.id?.replace?.(/^places\//, '') || pl.id;
      const lat = Number(pl.location?.latitude);
      const lng = Number(pl.location?.longitude);
      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const name = pl.displayName?.text ?? textQuery;
      const address = typeof pl.formattedAddress === 'string' ? pl.formattedAddress : '';
      all.push({ id, name, address, latitude: lat, longitude: lng });
    }

    pageToken = json.nextPageToken ?? json.next_page_token;
    if (!pageToken) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  const seen = new Set();
  return all.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

async function searchChainBranchesNearby(chainTitle, location, radiusMeters, signal) {
  const key = getApiKey();
  if (!key) throw new Error('Server missing GOOGLE_PLACES_API_KEY');

  const radius = Math.min(Math.max(Number(radiusMeters) || 0, 100), 50000);

  const body = {
    includedTypes: NEARBY_FOOD_TYPES,
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius,
      },
    },
  };

  const res = await fetch(SEARCH_NEARBY_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText || 'Nearby search failed';
    throw new Error(msg);
  }

  const places = Array.isArray(json.places) ? json.places : [];
  const out = [];
  for (const pl of places) {
    const id = pl.id?.replace?.(/^places\//, '') || pl.id;
    const lat = Number(pl.location?.latitude);
    const lng = Number(pl.location?.longitude);
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const name = pl.displayName?.text ?? '';
    if (!placeNameMatchesChain(chainTitle, name)) continue;
    const address = typeof pl.formattedAddress === 'string' ? pl.formattedAddress : '';
    out.push({ id, name, address, latitude: lat, longitude: lng });
  }
  return out;
}

export async function resolveBranchesForChain(chainTitle, location, radiusMeters, signal) {
  let nearby = [];
  try {
    nearby = await searchChainBranchesNearby(chainTitle, location, radiusMeters, signal);
  } catch {
    nearby = [];
  }
  if (nearby.length > 0) return nearby;

  const text = await searchNearbyBranches(chainTitle, location, radiusMeters, signal);
  const named = text.filter((p) => placeNameMatchesChain(chainTitle, p.name));
  if (radiusMeters > 50000) {
    // For large radii, return all matching branches without distance filter
    return named;
  }
  return named.filter(
    (p) => haversineDistanceMeters(location, { latitude: p.latitude, longitude: p.longitude }) <= radiusMeters
  );
}
