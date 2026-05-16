/**
 * Curated catalog of known loyalty programs, subscription services, and telecom rewards.
 * Each program includes real-world partner restaurants and exact deal details.
 * Data sourced from official loyalty program partner lists.
 */

export const LOYALTY_PROGRAMS = [
  {
    id: 'tastecard',
    name: 'Tastecard',
    partners: [
      // Pizza Chains
      {
        chainKey: 'pizzaexpress',
        businessName: 'PizzaExpress',
        dealDescription: '2 for 1 meals or 25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'pizza-hut-delivery',
        businessName: 'Pizza Hut Delivery',
        dealDescription: '50% off pizza delivery (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'dominos',
        businessName: "Domino's Pizza",
        dealDescription: '50% off pizza delivery min £30 spend (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'papa-johns',
        businessName: 'Papa Johns',
        dealDescription: '50% off pizza delivery min £30 spend (Mon-Sun)',
        category: 'Mains',
      },
      // Italian Chains
      {
        chainKey: 'prezzo',
        businessName: 'Prezzo',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'zizzi',
        businessName: 'Zizzi',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'ask-italian',
        businessName: 'ASK Italian',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'bella-italia',
        businessName: 'Bella Italia',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      // American/Casual Dining
      {
        chainKey: 'frankie-bennys',
        businessName: "Frankie & Benny's",
        dealDescription: '2 for 1 meals or 25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'chiquito',
        businessName: 'Chiquito',
        dealDescription: '2 for 1 meals or 25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'burger-king',
        businessName: 'Burger King',
        dealDescription: '25% off total bill via app integration (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'popeyes',
        businessName: 'Popeyes',
        dealDescription: '25% off total bill or specific meal perks (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'byron-burger',
        businessName: 'Byron Burger',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'gbk',
        businessName: 'Gourmet Burger Kitchen',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      // Casual Dining Chains
      {
        chainKey: 'banana-tree',
        businessName: 'Banana Tree',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'cafe-rouge',
        businessName: 'Café Rouge',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'coast-to-coast',
        businessName: 'Coast to Coast',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      // Pub Chains
      {
        chainKey: 'beefeater',
        businessName: 'Beefeater',
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'brewers-fayre',
        businessName: 'Brewers Fayre',
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'table-table',
        businessName: 'Table Table',
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'bar-block',
        businessName: 'Bar + Block',
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'whitbread-inns',
        businessName: 'Whitbread Inns',
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'marstons-pubs',
        businessName: "Marston's Pubs",
        dealDescription: '25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'belhaven-pubs',
        businessName: 'Belhaven Pubs',
        dealDescription: '25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'greene-king',
        businessName: 'Greene King Pubs',
        dealDescription: '25% off total bill (Mon-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'chef-brewer',
        businessName: 'Chef & Brewer',
        dealDescription: '25% off total bill (Mon-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'hungry-horse',
        businessName: 'Hungry Horse',
        dealDescription: '25% off total bill (Mon-Thu)',
        category: 'Mains',
      },
      // Cafes & Beverages
      {
        chainKey: 'caffe-nero',
        businessName: 'Caffè Nero',
        dealDescription: '25% off barista drinks twice daily (Mon-Sun)',
        category: 'Drinks',
      },
      {
        chainKey: 'black-sheep-coffee',
        businessName: 'Black Sheep Coffee',
        dealDescription: '25% off barista drinks (Mon-Sun)',
        category: 'Drinks',
      },
      {
        chainKey: 'morrisons-cafe',
        businessName: "Morrisons Café",
        dealDescription: '2 for 1 meals (Mon-Sun)',
        category: 'Mains',
      },
      // Snacks & Treats
      {
        chainKey: 'auntie-annes',
        businessName: "Auntie Anne's",
        dealDescription: '25% off total bill (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'krispy-kreme',
        businessName: 'Krispy Kreme',
        dealDescription: '25% off box purchases (Mon-Sun)',
        category: 'Dessert',
      },
      // Independent & Regional Partners (sample)
      {
        chainKey: 'aagrah-leeds',
        businessName: 'Aagrah Leeds City Centre',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'amaya-glasgow',
        businessName: 'Amaya Glasgow',
        dealDescription: '25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'ananda-edinburgh',
        businessName: 'Ananda Edinburgh',
        dealDescription: '2 for 1 meals (Mon-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'abyssinia-brighton',
        businessName: 'Abyssinia Brighton',
        dealDescription: '2 for 1 meals (Sun-Thu)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'o2-priority',
    name: 'O2 Priority',
    partners: [
      {
        chainKey: 'greggs',
        businessName: 'Greggs',
        dealDescription: 'Free weekly coffee or savoury item (Fri-Sat)',
        category: 'Drinks',
      },
      {
        chainKey: 'caffe-nero',
        businessName: 'Caffè Nero',
        dealDescription: '£1 hot drinks (Daily)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'three-plus',
    name: 'Three+',
    partners: [
      {
        chainKey: 'caffe-nero',
        businessName: 'Caffè Nero',
        dealDescription: '£1 barista-made drinks (Daily)',
        category: 'Drinks',
      },
      {
        chainKey: 'frankie-bennys',
        businessName: "Frankie & Benny's",
        dealDescription: '2 main meals for £10 (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'chiquito',
        businessName: 'Chiquito',
        dealDescription: '2 main meals for £10 (Sun-Thu)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'vodafone-veryme',
    name: 'Vodafone VeryMe',
    partners: [
      {
        chainKey: 'costa-coffee',
        businessName: 'Costa Coffee',
        dealDescription: 'Free weekly coffee or snack (rotating weekdays)',
        category: 'Drinks',
      },
      {
        chainKey: 'greggs',
        businessName: 'Greggs',
        dealDescription: 'Free weekly coffee or snack (rotating weekdays)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'ee-rewards',
    name: 'EE Rewards',
    partners: [
      {
        chainKey: 'ee-partner-chains',
        businessName: 'Select National Chains',
        dealDescription: '2 for 1 or £5 meal bundles (Mon-Sun)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'club-pret',
    name: 'Club Pret',
    partners: [
      {
        chainKey: 'pret-manger',
        businessName: 'Pret A Manger',
        dealDescription: '50% off up to 5 barista-made drinks per day (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'leon-club',
    name: 'Leon Club Subscription',
    partners: [
      {
        chainKey: 'leon',
        businessName: 'Leon',
        dealDescription: '30% off all food and drink (Mon-Sun)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'gourmet-society',
    name: 'Gourmet Society',
    partners: [
      {
        chainKey: 'gourmet-network',
        businessName: 'Gourmet Society Network',
        dealDescription: '2 for 1 meals, 50% off food, or 25% off total bill (Sun-Thu)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'meerkat-meals',
    name: 'Meerkat Meals',
    partners: [
      {
        chainKey: 'meerkat-partner-chains',
        businessName: 'Meerkat Partner Chains',
        dealDescription: '2 for 1 on starters, mains, desserts (Sun-Thu)',
        category: 'Mains',
      },
      {
        chainKey: 'dominos',
        businessName: "Domino's Pizza",
        dealDescription: '50% off pizzas (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'pizza-hut-delivery',
        businessName: 'Pizza Hut Delivery',
        dealDescription: '50% off pizzas (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'papa-johns',
        businessName: 'Papa Johns',
        dealDescription: '50% off pizzas (Mon-Sun)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'monzo-max',
    name: 'Monzo Max / Premium',
    partners: [
      {
        chainKey: 'greggs',
        businessName: 'Greggs',
        dealDescription: 'Free weekly snack or hot drink (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'barclays-blue',
    name: 'Barclays Blue Rewards',
    partners: [
      {
        chainKey: 'greggs',
        businessName: 'Greggs',
        dealDescription: 'Free weekly hot drink or sweet treat (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'natwest-digital',
    name: 'NatWest Digital Reward',
    partners: [
      {
        chainKey: 'uber-eats',
        businessName: 'Uber Eats',
        dealDescription: 'Free monthly £5 voucher (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'costa-coffee',
        businessName: 'Costa Coffee',
        dealDescription: 'Free monthly £5 voucher (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'vitality-health',
    name: 'Vitality Health',
    partners: [
      {
        chainKey: 'caffe-nero',
        businessName: 'Caffè Nero',
        dealDescription: 'Free weekly handmade drink via activity points (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'lloyds-choice',
    name: 'Lloyds Bank Choice Rewards',
    partners: [
      {
        chainKey: 'tastecard',
        businessName: 'Tastecard',
        dealDescription: 'Free annual Tastecard membership (Mon-Sun)',
        category: 'Mains',
      },
      {
        chainKey: 'gourmet-society',
        businessName: 'Gourmet Society',
        dealDescription: 'Free annual Gourmet Society membership (Mon-Sun)',
        category: 'Mains',
      },
    ],
  },
  {
    id: 'mywaitrose',
    name: 'myWaitrose',
    partners: [
      {
        chainKey: 'waitrose-cafe',
        businessName: 'Waitrose Café',
        dealDescription: 'Free daily coffee (filter or americano) with shop purchase (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'ikea-family',
    name: 'IKEA Family',
    partners: [
      {
        chainKey: 'ikea-restaurant',
        businessName: 'IKEA Restaurant',
        dealDescription: 'Free tea or filter coffee in customer restaurant (Mon-Fri)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'booths-card',
    name: 'Booths Card',
    partners: [
      {
        chainKey: 'booths-cafe',
        businessName: 'Booths',
        dealDescription: 'Free daily hot beverage with store purchase (Mon-Sun)',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'tesco-clubcard-plus',
    name: 'Tesco Clubcard Plus',
    partners: [
      {
        chainKey: 'tesco-stores',
        businessName: 'Tesco Stores',
        dealDescription: '10% off two large in-store shops per month (Mon-Sun)',
        category: 'Other',
      },
    ],
  },
  {
    id: 'odeon-mylimitless',
    name: 'Odeon MyLimitless',
    partners: [
      {
        chainKey: 'odeon',
        businessName: 'Odeon',
        dealDescription: '10% off all in-cinema food, snacks, drinks (Mon-Sun)',
        category: 'Other',
      },
    ],
  },
  {
    id: 'cineworld-unlimited',
    name: 'Cineworld Unlimited',
    partners: [
      {
        chainKey: 'cineworld',
        businessName: 'Cineworld',
        dealDescription: '10% off snacks (25% after one year) (Mon-Sun)',
        category: 'Other',
      },
    ],
  },
  {
    id: 'vue-pass',
    name: 'Vue Pass',
    partners: [
      {
        chainKey: 'vue-cinemas',
        businessName: 'Vue Cinema',
        dealDescription: 'Up to 20% off food and drink combos (Mon-Sun)',
        category: 'Other',
      },
    ],
  },
  {
    id: 'morrisons-more',
    name: 'Morrisons More',
    partners: [
      {
        chainKey: 'morrisons-cafe',
        businessName: 'Morrisons Cafe',
        dealDescription: 'Free tea or coffee',
        category: 'Drinks',
      },
    ],
  },
  {
    id: 'waitrose-partner',
    name: 'Waitrose Partner',
    partners: [
      {
        chainKey: 'waitrose-cafe',
        businessName: 'Waitrose Cafe',
        dealDescription: 'Free hot drink',
        category: 'Drinks',
      },
    ],
  },
];