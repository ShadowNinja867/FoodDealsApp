import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANCH_SEARCH_RADIUS_MILES, VISIBLE_DEALS_RADIUS_MILES } from '../constants/discovery';
import { getCachedBranchesForArea, saveBranchesCache } from '../data/chainLocationsCache';
import { DEFAULT_MAP_CENTER, isValidDealCategory } from '../data/foodDealsDatabase';
import { loadDeals, persistDeals } from '../data/dealsRepository';
import { DealComposeModal } from './DealComposeModal';
import { DealDetailBottomSheet } from './DealDetailBottomSheet';
import { LoyaltyProgramModal } from './LoyaltyProgramModal';
import { ALL_KEY, RestaurantSearchHeader } from './RestaurantSearchHeader';
import { RestaurantSearchModal } from './RestaurantSearchModal';
import { hasPlacesApiKey, resolveBranchesForChain } from '../services/googlePlaces';
import { haversineDistanceMiles, milesToMeters } from '../utils/geo';

// Leaflet HTML Template injected directly into the WebView
const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #05060A; }
    #map { width: 100vw; height: 100vh; }
    .pin-marker {
      width: 22px; height: 22px; border-radius: 50%; box-sizing: border-box;
      border: 2px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      position: absolute; left: 0px; top: 0px; z-index: 2;
    }
    .pin-stem {
      width: 3px; height: 10px; background: #FFFFFF;
      position: absolute; left: 9.5px; top: 21px; z-index: 1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .info-card {
      background: #0F1118; border: 1px solid; border-radius: 8px;
      padding: 8px 12px; color: #F8FAFC; width: max-content;
      max-width: 160px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; z-index: 3;
      pointer-events: none; /* Let clicks pass through the popup to the marker below */
    }
    .info-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-family: sans-serif; }
    .info-deal { font-size: 11px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-family: sans-serif; }
    .user-dot-wrap {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(56, 189, 248, 0.3);
      display: flex; justify-content: center; align-items: center;
    }
    .user-dot { width: 16px; height: 16px; border-radius: 50%; background: #38BDF8; border: 2px solid #FFFFFF; box-sizing: border-box; }
    .leaflet-div-icon { background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${DEFAULT_MAP_CENTER.latitude}, ${DEFAULT_MAP_CENTER.longitude}], 10);
    
    // Carto Voyager: Beautiful, free street map. Guaranteed to load in WebView.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    let markers = {};
    let userMarker = null;

    map.on('zoomend', function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ZOOM_CHANGED', zoom: map.getZoom() })); });

    window.updateMap = function(data) {
      if (data.userLocation) {
        if (!userMarker) {
          const icon = L.divIcon({ html: '<div class="user-dot-wrap"><div class="user-dot"></div></div>', className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
          userMarker = L.marker([data.userLocation.lat, data.userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(map);
          map.setView([data.userLocation.lat, data.userLocation.lng], 15);
        } else {
          userMarker.setLatLng([data.userLocation.lat, data.userLocation.lng]);
        }
      }

      for (let id in markers) {
        if (!data.pins.find(p => p.id === id)) { map.removeLayer(markers[id]); delete markers[id]; }
      }

      data.pins.forEach(pin => {
        let html = '';
        if (data.isZoomedIn) {
          let linesHtml = pin.lines.map(l => '<div class="info-deal">' + l + '</div>').join('');
          html += '<div class="info-card" style="border-color:' + pin.color + '"><div class="info-title">' + pin.title + '</div>' + linesHtml + '</div>';
        }
        html += '<div class="pin-marker" style="background:' + pin.color + '"></div><div class="pin-stem"></div>';

        // Tell Leaflet the physical size of the pin so the touch-area matches perfectly
        const icon = L.divIcon({ html, className: '', iconSize: [22, 32], iconAnchor: [11, 32] });
        if (markers[pin.id]) { markers[pin.id].setIcon(icon); markers[pin.id].setLatLng([pin.lat, pin.lng]); } else {
          const m = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
          m.on('click', () => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_CLICK', id: pin.id })); });
          markers[pin.id] = m;
        }
      });
    };
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
  </script>
</body>
</html>
`;

const CATEGORY_COLORS = {
  Mains: '#F97316',
  Dessert: '#A855F7',
  Drinks: '#38BDF8',
};

function slugChain(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildPinDisplayLines(pin) {
  const details = pin.dealDescriptions ?? [pin.dealDescription || ''];
  return [
    pin.businessName,
    ...details.filter(Boolean).map((line) => `• ${line}`),
  ];
}

export function FoodDealsMap() {
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const searchAbortRef = useRef(null);
  const locationPinsRef = useRef([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);
  
  const isZoomedIn = zoomLevel >= 15;
  const [deals, setDeals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_KEY);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Restaurant search flow
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeChainName, setComposeChainName] = useState('');
  const [composeBranchCount, setComposeBranchCount] = useState(0);
  const [composeLoading, setComposeLoading] = useState(false);
  const [pendingBranches, setPendingBranches] = useState([]);

  // Loyalty program feature
  const [loyaltyModalVisible, setLoyaltyModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const centerOnCoordinate = useCallback((latitude, longitude, zoomLevel = 15) => {
    webViewRef.current?.injectJavaScript(`
      if (typeof map !== 'undefined') { map.setView([${latitude}, ${longitude}], ${zoomLevel}); }
      true;
    `);
  }, []);

  const onMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'READY') {
        setIsMapReady(true);
      } else if (msg.type === 'ZOOM_CHANGED') {
        setZoomLevel(msg.zoom);
      } else if (msg.type === 'MARKER_CLICK') {
          const pin = locationPinsRef.current.find((p) => p.id === msg.id);
        if (pin) {
          setSelectedDeal(pin);
          setDetailVisible(true);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadDeals();
      if (!cancelled) setDeals(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) {
        if (status !== 'granted') {
          Alert.alert(
            'Location access',
            'Location is used to search nearby restaurants and plot Google Maps locations.'
          );
        }
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (cancelled) return;
      const { latitude, longitude } = current.coords;
      setUserLocation({ latitude, longitude });
      centerOnCoordinate(latitude, longitude, 15);
    })();
    return () => {
      cancelled = true;
    };
  }, [centerOnCoordinate]);

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return;
    const data = {
      userLocation: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null,
      pins: locationPins.map(pin => ({
        id: pin.id,
        lat: pin.latitude,
        lng: pin.longitude,
        color: CATEGORY_COLORS[pin.deals[0]?.category] ?? '#94A3B8',
        title: pin.businessName,
        lines: buildPinDisplayLines(pin).slice(1)
      })),
      isZoomedIn
    };
    const js = `if (window.updateMap) window.updateMap(${JSON.stringify(data)}); true;`;
    webViewRef.current.injectJavaScript(js);
  }, [locationPins, userLocation, isZoomedIn, isMapReady]);

  const categoryFilteredDeals = useMemo(() => {
    if (selectedCategory === ALL_KEY) return deals;
    return deals.filter((d) => d.category === selectedCategory);
  }, [deals, selectedCategory]);

  const locationPins = useMemo(() => {
    const groups = {};
    categoryFilteredDeals.forEach((deal) => {
      const placeKey = deal.googlePlaceId || `${deal.latitude}:${deal.longitude}`;
      if (!groups[placeKey]) {
        groups[placeKey] = {
          id: placeKey,
          googlePlaceId: deal.googlePlaceId,
          businessName: deal.businessName,
          address: deal.address,
          latitude: deal.latitude,
          longitude: deal.longitude,
          chainKey: deal.chainKey,
          deals: [deal],
          dealDescriptions: [deal.dealDescription],
        };
      } else {
        groups[placeKey].deals.push(deal);
        if (!groups[placeKey].dealDescriptions.includes(deal.dealDescription)) {
          groups[placeKey].dealDescriptions.push(deal.dealDescription);
        }
      }
    });

    const locations = Object.values(groups);
    if (!userLocation) return locations;

    return locations.filter(
      (pin) =>
        haversineDistanceMiles(userLocation, { latitude: pin.latitude, longitude: pin.longitude }) <=
        VISIBLE_DEALS_RADIUS_MILES
    );
  }, [categoryFilteredDeals, userLocation]);

  // Keep the ref strictly in sync with locationPins to prevent WebView stale closures
  useEffect(() => {
    locationPinsRef.current = locationPins;
  }, [locationPins]);

  const activeChains = useMemo(() => {
    const chains = {};
    deals.forEach((deal) => {
      if (!chains[deal.chainKey]) {
        chains[deal.chainKey] = deal.businessName;
      }
    });
    return Object.entries(chains).map(([key, name]) => ({ key, name }));
  }, [deals]);

  const handleDeleteChain = useCallback(async (chainKey) => {
    const next = deals.filter((d) => d.chainKey !== chainKey);
    setDeals(next);
    try {
      await persistDeals(next);
    } catch {
      Alert.alert('Save failed', 'Could not write to device storage.');
    }
  }, [deals]);

  const handleRestaurantPicked = useCallback(
    async (placeItem) => {
      const chainKey = slugChain(placeItem.title);
      setComposeChainName(placeItem.title);
      setSearchModalVisible(false);

      if (!userLocation) {
        Alert.alert('Location', 'Waiting for your location...');
        return;
      }

      setComposeLoading(true);
      const searchRadiusM = milesToMeters(BRANCH_SEARCH_RADIUS_MILES);
      const ac = new AbortController();
      searchAbortRef.current = ac;

      try {
        let branches = await resolveBranchesForChain(placeItem.title, userLocation, searchRadiusM, ac.signal);
        if (!ac.signal.aborted) {
          setComposeBranchCount(branches.length || 0);
          setPendingBranches(branches || []);
          setComposeOpen(true);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') {
          Alert.alert('Error', `Failed to find branches: ${e?.message || 'unknown error'}`);
        }
      } finally {
        if (!ac.signal.aborted) {
          setComposeLoading(false);
        }
      }
    },
    [userLocation]
  );

  const handleComposeConfirm = useCallback(
    async (payload) => {
      if (!userLocation || pendingBranches.length === 0) {
        Alert.alert('Missing data', 'Location or branches missing.');
        return;
      }

      const chainKey = slugChain(composeChainName);
      const newDeals = pendingBranches.map((b) => ({
        id: b.id,
        googlePlaceId: b.id,
        businessName: b.name,
        address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
        dealDescription: payload.dealDescription,
        category: payload.category,
        chainKey: chainKey,
      }));

      const next = [...deals, ...newDeals];
      setDeals(next);
      try {
        await persistDeals(next);
      } catch {
        Alert.alert('Save failed', 'Could not write to device storage.');
      }

      setComposeOpen(false);
      setPendingBranches([]);
      setComposeChainName('');
    },
    [userLocation, pendingBranches, composeChainName, deals]
  );

  const barSubtitle = useMemo(() => {
    if (deals.length === 0) {
      return 'Tap + to search a chain, pick a name, then describe the deal.';
    }
    if (!userLocation) {
      return `${deals.length} saved — turn on location to show pins within ${VISIBLE_DEALS_RADIUS_MILES} mi.`;
    }
    const totalShown = locationPins.length;
    const suffix = `within ${VISIBLE_DEALS_RADIUS_MILES} mi`;
    if (selectedCategory === ALL_KEY) {
      return totalShown === locationPins.length
        ? `${totalShown} pin${totalShown === 1 ? '' : 's'} ${suffix}`
        : `${totalShown} of ${locationPins.length} saved ${suffix}`;
    }
    return `${totalShown} pin${totalShown === 1 ? '' : 's'} (${selectedCategory}) ${suffix}`;
  }, [deals.length, locationPins.length, selectedCategory, userLocation]);

  const handleSelectLoyaltyProgram = useCallback(
    async (program) => {
      if (!userLocation) {
        Alert.alert('Location', 'Waiting for your location. Enable GPS and try again.');
        return;
      }

      if (!hasPlacesApiKey()) {
        Alert.alert(
          'Food Deals API',
          'This app talks to your Food Deals API server (one Google key on the server for everyone). Set EXPO_PUBLIC_API_BASE_URL to that server URL, or add apiBaseUrl to local.keys.json — see server/README.txt. Then restart Expo with: npx expo start --clear'
        );
        return;
      }

      const newDeals = [];
      const searchRadiusM = milesToMeters(BRANCH_SEARCH_RADIUS_MILES);

      for (const partner of program.partners) {
        const chainSlug = slugChain(partner.businessName);
        const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
        const CACHE_AREA_M = 40_000;

        try {
          let branches = await getCachedBranchesForArea(
            chainSlug,
            userLocation.latitude,
            userLocation.longitude,
            CACHE_TTL_MS,
            CACHE_AREA_M
          );
          if (!branches || branches.length === 0) {
            branches = await resolveBranchesForChain(partner.businessName, userLocation, searchRadiusM);
            if (branches.length > 0) {
              await saveBranchesCache(chainSlug, userLocation.latitude, userLocation.longitude, branches);
            }
          }
          if (branches.length === 0) {
            console.warn(`No branches found for ${partner.businessName}`);
            continue;
          }
          const partnerDeals = branches.map((b) => ({
            id: b.id,
            googlePlaceId: b.id,
            businessName: b.name,
            address: b.address,
            latitude: b.latitude,
            longitude: b.longitude,
            dealDescription: partner.dealDescription,
            category: partner.category,
            chainKey: partner.chainKey,
          }));
          newDeals.push(...partnerDeals);
        } catch (e) {
          console.error(`Error adding ${partner.businessName}:`, e);
        }
      }

      if (newDeals.length > 0) {
        const next = [...deals, ...newDeals];
        setDeals(next);
        try {
          await persistDeals(next);
        } catch {
          Alert.alert('Save failed', 'Could not write to device storage.');
        }
        Alert.alert('Success', `Added ${newDeals.length} deals from ${program.name}!`);
      } else {
        Alert.alert('No deals added', 'Could not find any partner locations nearby.');
      }
    },
    [userLocation, deals]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Food Deals</Text>
        <Pressable onPress={() => setDrawerVisible(true)} style={styles.burgerButton}>
          <Text style={styles.burgerIcon}>☰</Text>
        </Pressable>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={StyleSheet.absoluteFill}
      />


      <RestaurantSearchHeader selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} subtitle={barSubtitle} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add restaurant"
        onPress={() => setSearchModalVisible(true)}
        style={[styles.fab, { bottom: insets.bottom + 22 }]}
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

      <RestaurantSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        userLocation={userLocation}
        onPick={handleRestaurantPicked}
      />

      <DealComposeModal
        visible={composeOpen}
        chainName={composeChainName}
        branchCount={composeBranchCount}
        loading={composeLoading}
        onClose={() => {
          searchAbortRef.current?.abort();
          setComposeOpen(false);
          setPendingBranches([]);
          setComposeLoading(false);
        }}
        onConfirm={handleComposeConfirm}
      />

      <DealDetailBottomSheet
        visible={detailVisible}
        deal={selectedDeal}
        onClose={() => {
          setDetailVisible(false);
          setSelectedDeal(null);
        }}
      />

      <Modal visible={drawerVisible} animationType="slide" transparent onRequestClose={() => setDrawerVisible(false)}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerVisible(false)} />
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>Menu</Text>

            {/* Loyalty Program Section */}
            <View style={styles.loyaltySectionContainer}>
              <Text style={styles.loyaltyPrompt}>Want to add a loyalty programme? E.g. Tastecard</Text>
              <Pressable
                style={styles.loyaltyButton}
                onPress={() => {
                  setLoyaltyModalVisible(true);
                }}
              >
                <Text style={styles.loyaltyButtonText}>Add Loyalty Program</Text>
              </Pressable>
            </View>

            {/* Active Restaurants */}
            {activeChains.length > 0 && (
              <View style={styles.restaurantSection}>
                <Text style={styles.restaurantSectionTitle}>Your Restaurants</Text>
                {activeChains.map((chain) => (
                  <View key={chain.key} style={styles.chainItem}>
                    <Text style={styles.chainName}>{chain.name}</Text>
                    <Pressable onPress={() => handleDeleteChain(chain.key)} style={styles.deleteButton}>
                      <Text style={styles.deleteIcon}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LoyaltyProgramModal
        visible={loyaltyModalVisible}
        onClose={() => setLoyaltyModalVisible(false)}
        onSelectProgram={handleSelectLoyaltyProgram}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#0F1118',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  burgerButton: {
    padding: 10,
  },
  burgerIcon: {
    color: '#F8FAFC',
    fontSize: 24,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.55)',
  },
  drawer: {
    width: 280,
    backgroundColor: '#0F1118',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  drawerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  loyaltySectionContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  loyaltyPrompt: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 18,
  },
  loyaltyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  loyaltyButtonText: {
    color: '#0B0D12',
    fontSize: 14,
    fontWeight: '700',
  },
  restaurantSection: {
    marginTop: 12,
  },
  restaurantSectionTitle: {
    color: 'rgba(226,232,240,0.72)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chainName: {
    color: '#F8FAFC',
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  deleteIcon: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fabPlus: {
    color: '#0B0D12',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
