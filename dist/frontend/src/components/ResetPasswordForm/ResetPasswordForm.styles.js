"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = void 0;
const react_native_1 = require("react-native");
const RED = '#ab1e24';
const BORDER = '#d9a7aa';
const CARD_BG = '#f2f2f2';
exports.styles = react_native_1.StyleSheet.create({
    card: {
        width: '86%',
        maxWidth: 460,
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e8c3c4',
        gap: 10,
        alignSelf: 'center',
    },
    title: {
        color: RED,
        fontFamily: 'Manrope_700Bold',
        fontSize: 22,
        lineHeight: 28,
    },
    subtitle: {
        color: '#7e4a4e',
        fontFamily: 'Manrope_400Regular',
        fontSize: 13,
    },
    label: {
        color: RED,
        fontFamily: 'Manrope_700Bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    inputWrap: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        paddingHorizontal: 12,
        height: 42,
    },
    input: {
        flex: 1,
        height: '100%',
        color: RED,
        fontFamily: 'Manrope_400Regular',
        fontSize: 14,
        paddingVertical: 0,
        borderWidth: 0,
    },
    eyeButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    error: {
        color: RED,
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
    notice: {
        color: '#1f7a47',
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
    primaryButton: {
        backgroundColor: RED,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonDisabled: {
        backgroundColor: '#e5b0b3',
    },
    primaryButtonText: {
        color: '#f7fffd',
        fontFamily: 'Manrope_700Bold',
        fontSize: 15,
    },
    linkButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    linkText: {
        color: RED,
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
});
//# sourceMappingURL=ResetPasswordForm.styles.js.map