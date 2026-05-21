import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEAL_CATEGORIES } from '../data/foodDealsDatabase';

const ALL_KEY = 'All';
const FILTER_CHIPS = [ALL_KEY, ...DEAL_CATEGORIES];

/**
 * @param {{
 *   selectedCategory: string,
 *   onSelectCategory: (c: string) => void,
 *   subtitle?: string,
 * }} props
 */
export function RestaurantSearchHeader({ selectedCategory, onSelectCategory, subtitle }) {
  const insets = useSafeAreaInsets();
  const hint = subtitle ?? 'Tap + to search a chain, pick a name, then describe the deal. Or use the menu (☰) to add loyalty programs.';

  return (
    <View style={[styles.wrapper, { top: insets.top + 60 }]} pointerEvents="box-none">
      <View style={styles.inner}>
        <Text style={styles.subtitle}>{hint}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTER_CHIPS.map((item) => {
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onSelectCategory(item)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export { ALL_KEY };

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  inner: {
    marginHorizontal: 16,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 14, 22, 0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: 'rgba(226,232,240,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
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
  chipLabel: {
    color: 'rgba(248,250,252,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#0B0D12',
  },
});
