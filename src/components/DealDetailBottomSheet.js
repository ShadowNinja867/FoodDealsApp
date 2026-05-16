import { Linking, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { googleMapsPlaceUrl } from '../services/googlePlaces';

/**
 * @param {{
 *   visible: boolean,
 *   deal: object | null,
 *   onClose: () => void,
 * }} props
 */
export function DealDetailBottomSheet({ visible, deal, onClose }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxSheet = Math.min(height * 0.58, 440);

  if (!deal) {
    return null;
  }

  const openMaps = () => {
    const url = googleMapsPlaceUrl(deal.googlePlaceId, deal.latitude, deal.longitude);
    Linking.openURL(url).catch(() => {});
  };

  const dealItems = deal.deals ?? [deal];
  const categories = Array.from(new Set(dealItems.map((item) => item.category).filter(Boolean)));
  const categoryLabel = categories.length === 1 ? categories[0] : 'Multiple';
  const uniqueDescriptions = Array.from(
    new Set(dealItems.map((item) => item.dealDescription).filter(Boolean))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close deal details" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: maxSheet }]}>
          <View style={styles.handle} />
          <Text style={styles.badge}>{categoryLabel}</Text>
          <Text style={styles.business}>{deal.businessName}</Text>
          {!!deal.address && <Text style={styles.address}>{deal.address}</Text>}
          {uniqueDescriptions.map((description, index) => (
            <Text key={index} style={styles.description}>• {description}</Text>
          ))}
          <Text style={styles.permanent}>Ongoing deal</Text>

          <Pressable style={styles.mapsBtn} onPress={openMaps}>
            <Text style={styles.mapsLabel}>Open in Google Maps</Text>
          </Pressable>
        </View>
      </View>
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
    paddingHorizontal: 22,
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
    marginBottom: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#0B0D12',
    backgroundColor: '#FDE68A',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  business: {
    marginTop: 12,
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  address: {
    marginTop: 6,
    color: 'rgba(148,163,184,0.95)',
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    marginTop: 10,
    color: 'rgba(226,232,240,0.92)',
    fontSize: 15,
    lineHeight: 22,
  },
  permanent: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(74,222,128,0.95)',
    fontWeight: '600',
  },
  mapsBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  mapsLabel: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
});
