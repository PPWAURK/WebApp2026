import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';

type UnreadNewsPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  sender: string;
  previewTitle?: string | null;
  closeLabel: string;
  viewLabel: string;
  onClose: () => void;
  onView: () => void;
};

export function UnreadNewsPopup({
  visible,
  title,
  message,
  sender,
  previewTitle,
  closeLabel,
  viewLabel,
  onClose,
  onView,
}: UnreadNewsPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="mail-unread-outline"
                size={18}
                color={COLORS.brandPrimary}
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>{title}</Text>
              <Text style={styles.title}>1 条新消息</Text>
            </View>
          </View>

          <View style={styles.bodyCard}>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.sender}>{sender}</Text>
            {previewTitle ? (
              <View style={styles.previewPill}>
                <Text style={styles.previewLabel}>标题</Text>
                <Text style={styles.previewText} numberOfLines={1}>
                  {previewTitle}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>{closeLabel}</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onView}>
              <Text style={styles.primaryButtonText}>{viewLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 20, 22, 0.4)',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfacePrimarySoft,
    borderWidth: 1,
    borderColor: COLORS.borderPrimarySoft,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    color: COLORS.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: COLORS.brandPrimaryDark,
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  bodyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.surfaceSubtle,
    padding: 14,
    gap: 8,
  },
  message: {
    color: COLORS.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  sender: {
    color: COLORS.brandPrimary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  previewPill: {
    borderRadius: 12,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  previewLabel: {
    color: COLORS.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  previewText: {
    color: COLORS.brandPrimaryDark,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoftStrong,
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 42,
  },
  secondaryButtonText: {
    color: COLORS.brandPrimaryDark,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderPrimarySoft,
    backgroundColor: COLORS.surfacePrimarySoft,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 42,
  },
  primaryButtonText: {
    color: COLORS.brandPrimary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
