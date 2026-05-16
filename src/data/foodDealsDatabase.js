/**
 * Deal categories (permanent deals — no expiry in the app).
 */

export const DEAL_CATEGORIES = ['Mains', 'Dessert', 'Drinks'];

export const DEFAULT_MAP_CENTER = {
  latitude: 37.78825,
  longitude: -122.40748,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

/** @param {string} category */
export function isValidDealCategory(category) {
  return DEAL_CATEGORIES.includes(category);
}
