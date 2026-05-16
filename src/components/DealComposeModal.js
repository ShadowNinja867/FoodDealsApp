import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEAL_CATEGORIES } from '../data/foodDealsDatabase';
import { BRANCH_SEARCH_RADIUS_MILES } from '../constants/discovery';

/**
 * @param {{
 *   visible: boolean,
 *   chainName: string,
 *   branchCount: number,
 *   loading: boolean,
 *   onClose: () => void,
 *   onConfirm: (payload: { dealDescription: string, category: string }) => void,
 * }} props
 */
export function DealComposeModal({ visible, chainName, branchCount, loading, onClose, onConfirm }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxSheet = Math.min(height * 0.55, 440);

  const [dealDescription, setDealDescription] = useState('');
  const [category, setCategory] = useState(DEAL_CATEGORIES[0]);

  useEffect(() => {
    if (visible) {
      setDealDescription('');
      setCategory(DEAL_CATEGORIES[0]);
    }
  }, [visible]);

  const save = () => {
    const desc = dealDescription.trim();
    if (!desc) {
      Alert.alert('Deal text', 'Enter a short description for this deal.');
      return;
    }
    onConfirm({ dealDescription: desc, category });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: maxSheet }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Deal for {chainName || 'restaurant'}</Text>
          <Text style={styles.helper}>
            We found {branchCount} Google Maps location{branchCount === 1 ? '' : 's'} within {BRANCH_SEARCH_RADIUS_MILES}{' '}
            miles of you. This deal applies to each pin.
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading locations…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Deal description</Text>
              <TextInput
                value={dealDescription}
                onChangeText={setDealDescription}
                placeholder="e.g. $5 fill-up box"
                placeholderTextColor="rgba(148,163,184,0.75)"
                style={[styles.input, styles.inputMultiline]}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {DEAL_CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.primaryBtn} onPress={save}>
                <Text style={styles.primaryLabel}>Add pins to map</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 10, 0.55)',
  },
  sheet: {
    backgroundColor: '#0F1118',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
    marginBottom: 14,
    color: 'rgba(226,232,240,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF8F66',
  },
  chipText: {
    color: 'rgba(248,250,252,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0B0D12',
  },
  primaryBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#052E16',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(226,232,240,0.8)',
    fontSize: 14,
  },
});
