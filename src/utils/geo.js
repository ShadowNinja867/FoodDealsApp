const EARTH_RADIUS_MILES = 3958.8;

/**
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} Great-circle distance in miles.
 */
export function haversineDistanceMiles(a, b) {
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

/**
 * @param {number} miles
 * @returns {number} Meters (for Places API circles).
 */
export function milesToMeters(miles) {
  return miles * 1609.344;
}

/**
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} Great-circle distance in meters.
 */
export function haversineDistanceMeters(a, b) {
  return haversineDistanceMiles(a, b) * 1609.344;
}
