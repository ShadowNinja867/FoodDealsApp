import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fooddealsapp/location_deals_v2';

/** @param {unknown} d */
export function isValidDealRecord(d) {
  return (
    d &&
    typeof d.id === 'string' &&
    typeof d.googlePlaceId === 'string' &&
    typeof d.businessName === 'string' &&
    typeof d.dealDescription === 'string' &&
    typeof d.latitude === 'number' &&
    typeof d.longitude === 'number' &&
    typeof d.category === 'string' &&
    typeof d.address === 'string' &&
    typeof d.chainKey === 'string'
  );
}

/**
 * @returns {Promise<Array<object>>}
 */
export async function loadUserDeals() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidDealRecord);
  } catch {
    return [];
  }
}

/**
 * @param {Array<object>} deals
 */
export async function saveUserDeals(deals) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}
