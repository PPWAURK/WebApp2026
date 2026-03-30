import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  singleAction?: boolean;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  destructive,
  singleAction,
  cancelDisabled,
  confirmDisabled,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={singleAction ? onConfirm : onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {singleAction ? null : (
              <Pressable
                style={[
                  styles.cancelButton,
                  cancelDisabled && styles.buttonDisabled,
                ]}
                onPress={onCancel}
                disabled={cancelDisabled}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.confirmButton,
                destructive
                  ? styles.confirmButtonDanger
                  : styles.confirmButtonPrimary,
                confirmDisabled && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={confirmDisabled}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text
                style={[
                  styles.confirmText,
                  destructive
                    ? styles.confirmTextDanger
                    : styles.confirmTextPrimary,
                ]}
              >
                {confirmLabel}
              </Text>
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
    backgroundColor: 'rgba(36, 20, 22, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    gap: 10,
  },
  title: {
    color: COLORS.brandPrimaryDark,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  message: {
    color: COLORS.textMutedSoft,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoftStrong,
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonPrimary: {
    borderColor: COLORS.borderPrimarySoft,
    backgroundColor: COLORS.surfacePrimarySoft,
  },
  confirmButtonDanger: {
    borderColor: COLORS.borderDangerSoft,
    backgroundColor: COLORS.surfaceDangerSoft,
  },
  cancelText: {
    color: COLORS.brandPrimaryDark,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  confirmText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  confirmTextPrimary: {
    color: COLORS.brandPrimaryDark,
  },
  confirmTextDanger: {
    color: COLORS.brandPrimary,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
