import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { matchPopularChains } from '../data/popularChains';
import { autocompleteRestaurants, hasPlacesApiKey } from '../services/googlePlaces';

const DEBOUNCE_MS = 120;

/**
 * @param {{
 *   visible: boolean,
 *   onClose: () => void,
 *   userLocation: { latitude: number, longitude: number } | null,
 *   onPick: (item: { placeId: string, title: string, subtitle: string }) => void,
 * }} props
 */
export function RestaurantSearchModal({ visible, onClose, userLocation, onPick }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [googleRows, setGoogleRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setGoogleRows([]);
      setError('');
      setLoading(false);
      abortRef.current?.abort();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [visible]);

  const localRows = useMemo(() => matchPopularChains(query), [query]);

  const runGoogle = useCallback(
    async (text) => {
      if (!hasPlacesApiKey() || !userLocation) {
        setGoogleRows([]);
        setLoading(false);
        return;
      }
      const q = text.trim();
      if (q.length < 2) {
        setGoogleRows([]);
        setLoading(false);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setError('');
      try {
        const list = await autocompleteRestaurants(q, userLocation, ac.signal);
        if (!ac.signal.aborted) setGoogleRows(list);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setGoogleRows([]);
        setError(e?.message || 'Google search failed');
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [userLocation]
  );

  useEffect(() => {
    if (!visible) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runGoogle(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, runGoogle]);

  const displayRows = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const g of googleRows) {
      const k = g.title.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ ...g, source: 'google' });
    }
    for (const l of localRows) {
      const k = l.title.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ ...l, source: 'local' });
    }
    return out;
  }, [googleRows, localRows]);

  const showEmptyHint =
    visible &&
    query.trim().length >= 1 &&
    !loading &&
    displayRows.length === 0 &&
    !error;

  const pick = (item) => {
    Keyboard.dismiss();
    onPick(item);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top + 8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Find a chain</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close search">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Type to see matches. Tap a name, then describe the deal on the next screen.
        </Text>

        {!hasPlacesApiKey() && (
          <View style={styles.apiNotice}>
            <Text style={styles.apiNoticeTitle}>Food Deals API</Text>
            <Text style={styles.apiNoticeBody}>
              Restaurant search runs on your backend (one Google key for all users). Set EXPO_PUBLIC_API_BASE_URL
              or local.keys.json → apiBaseUrl, start the server in /server, then restart Expo (npx expo start
              --clear). See server/README.txt.
            </Text>
          </View>
        )}

        <View style={styles.searchWrap}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. KFC, Starbucks…"
            placeholderTextColor="rgba(148,163,184,0.75)"
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {loading && (
            <View style={styles.spinner}>
              <ActivityIndicator color="#FF6B35" size="small" />
            </View>
          )}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {showEmptyHint && (
          <Text style={styles.empty}>No chains match yet — keep typing or try another spelling.</Text>
        )}

        <FlatList
          keyboardShouldPersistTaps="handled"
          data={displayRows}
          keyExtractor={(item) => item.placeId}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={
            displayRows.length > 0 ? (
              <Text style={styles.listHeader}>Matching restaurants</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => pick(item)}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.subtitle}</Text>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0D12',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  closeText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  apiNotice: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  apiNoticeTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  apiNoticeBody: {
    color: 'rgba(226,232,240,0.88)',
    fontSize: 13,
    lineHeight: 19,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingRight: 44,
    color: '#F8FAFC',
    fontSize: 17,
  },
  spinner: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    color: '#fca5a5',
    fontSize: 13,
    marginBottom: 8,
  },
  empty: {
    color: 'rgba(148,163,184,0.95)',
    fontSize: 14,
    marginBottom: 12,
  },
  listHeader: {
    color: 'rgba(226,232,240,0.65)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600',
  },
  rowSub: {
    marginTop: 4,
    color: 'rgba(148,163,184,0.95)',
    fontSize: 13,
  },
});
