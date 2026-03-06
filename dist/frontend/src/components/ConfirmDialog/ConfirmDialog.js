"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDialog = ConfirmDialog;
const react_native_1 = require("react-native");
function ConfirmDialog({ visible, title, message, cancelLabel, confirmLabel, destructive, onCancel, onConfirm, }) {
    return (<react_native_1.Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <react_native_1.View style={styles.backdrop}>
        <react_native_1.View style={styles.card}>
          <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>
          <react_native_1.Text style={styles.message}>{message}</react_native_1.Text>

          <react_native_1.View style={styles.actions}>
            <react_native_1.Pressable style={styles.cancelButton} onPress={onCancel}>
              <react_native_1.Text style={styles.cancelText}>{cancelLabel}</react_native_1.Text>
            </react_native_1.Pressable>
            <react_native_1.Pressable style={[
            styles.confirmButton,
            destructive ? styles.confirmButtonDanger : styles.confirmButtonPrimary,
        ]} onPress={onConfirm}>
              <react_native_1.Text style={[
            styles.confirmText,
            destructive ? styles.confirmTextDanger : styles.confirmTextPrimary,
        ]}>
                {confirmLabel}
              </react_native_1.Text>
            </react_native_1.Pressable>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.Modal>);
}
const styles = react_native_1.StyleSheet.create({
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
        borderColor: '#e3c0c3',
        backgroundColor: '#fffdfd',
        padding: 14,
        gap: 10,
    },
    title: {
        color: '#7f1b21',
        fontFamily: 'Manrope_700Bold',
        fontSize: 16,
    },
    message: {
        color: '#8b5a5e',
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
        borderColor: '#dfb0b2',
        backgroundColor: '#fffafa',
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
        borderColor: '#d39a9d',
        backgroundColor: '#f9eaeb',
    },
    confirmButtonDanger: {
        borderColor: '#d88084',
        backgroundColor: '#fff1f2',
    },
    cancelText: {
        color: '#7f1b21',
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
    confirmText: {
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
    confirmTextPrimary: {
        color: '#7f1b21',
    },
    confirmTextDanger: {
        color: '#ab1e24',
    },
});
//# sourceMappingURL=ConfirmDialog.js.map