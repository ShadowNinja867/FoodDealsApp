import { getApiBaseUrl } from '../services/foodDealsApi';
import { loadUserDeals, saveUserDeals, isValidDealRecord } from './dealsStorage';

function apiBase() {
  return getApiBaseUrl();
}

/**
 * Load deals: GET from Food Deals API when configured, else local AsyncStorage.
 * @returns {Promise<Array<object>>}
 */
export async function loadDeals() {
  const base = apiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/api/deals`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data) ? data : data?.deals;
        if (Array.isArray(list)) {
          const valid = list.filter(isValidDealRecord);
          await saveUserDeals(valid);
          return valid;
        }
      }
    } catch {
      /* use local */
    }
  }
  return loadUserDeals();
}

/**
 * Persist deals locally and mirror to PUT /api/deals when API base is set.
 * @param {Array<object>} deals
 */
export async function persistDeals(deals) {
  await saveUserDeals(deals);
  const base = apiBase();
  if (!base) return;
  try {
    await fetch(`${base}/api/deals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deals }),
    });
  } catch {
    /* local save already succeeded */
  }
}
