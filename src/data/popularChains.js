/**
 * Well-known chains for instant type-ahead (merged with Google suggestions).
 * Picks use Google Text Search by name — same as choosing a Google row.
 */
export const POPULAR_CHAINS = [
  'KFC',
  "McDonald's",
  'Burger King',
  'Starbucks',
  'Subway',
  'Taco Bell',
  "Wendy's",
  'Chipotle',
  "Dunkin'",
  "Domino's",
  'Pizza Hut',
  'Popeyes',
  "Arby's",
  'Chick-fil-A',
  'Panera Bread',
  'Olive Garden',
  "Applebee's",
  'IHOP',
  "Denny's",
  'Five Guys',
  'Shake Shack',
  "Nando's",
  'Buffalo Wild Wings',
  'Texas Roadhouse',
  'Red Lobster',
  'Outback Steakhouse',
  'Cracker Barrel',
  'Tim Hortons',
  'Qdoba',
  "Jersey Mike's",
  "Jimmy John's",
  'Panda Express',
  "Papa John's",
  'Little Caesars',
  "Hardee's",
  "Carl's Jr.",
  'SONIC',
  'Dairy Queen',
  'Wingstop',
  'In-N-Out Burger',
  'Whataburger',
  'Raising Canes',
  'Culvers',
  'Smoothie King',
  'Cold Stone Creamery',
  'Baskin-Robbins',
  'Krispy Kreme',
];

/**
 * @param {string} query
 * @returns {Array<{ placeId: string, title: string, subtitle: string }>}
 */
export function matchPopularChains(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return POPULAR_CHAINS.filter((name) => name.toLowerCase().includes(q))
    .sort((a, b) => {
      const ia = a.toLowerCase().indexOf(q);
      const ib = b.toLowerCase().indexOf(q);
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    })
    .slice(0, 14)
    .map((title) => ({
      placeId: `local:${title}`,
      title,
      subtitle: 'Popular chain',
    }));
}
