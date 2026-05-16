import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOYALTY_PROGRAMS } from '../data/loyaltyCatalog';

/**
 * @param {{
 *   visible: boolean,
 *   onClose: () => void,
 *   onSelectProgram: (program: object) => void,
 * }} props
 */
export function LoyaltyProgramModal({ visible, onClose, onSelectProgram }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return LOYALTY_PROGRAMS;
    const query = searchQuery.toLowerCase();
    return LOYALTY_PROGRAMS.filter((program) =>
      program.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const renderProgram = ({ item }) => (
    <Pressable
      style={styles.programItem}
      onPress={() => {
        onSelectProgram(item);
        onClose();
      }}
    >
      <Text style={styles.programName}>{item.name}</Text>
      <Text style={styles.programPartners}>
        {item.partners.length} partner{item.partners.length === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: height * 0.8 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select Loyalty Program</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search programs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <FlatList
            data={filteredPrograms}
            keyExtractor={(item) => item.id}
            renderItem={renderProgram}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
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
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  listContainer: {
    paddingBottom: 16,
  },
  programItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  programName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
  },
  programPartners: {
    color: 'rgba(226,232,240,0.72)',
    fontSize: 14,
    marginTop: 4,
  },
});