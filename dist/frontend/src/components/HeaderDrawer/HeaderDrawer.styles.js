"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = void 0;
const react_native_1 = require("react-native");
exports.styles = react_native_1.StyleSheet.create({
    headerBar: {
        height: 72,
        borderRadius: 18,
        marginHorizontal: 12,
        marginTop: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e4afb0',
        backgroundColor: 'rgba(255,245,246,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 3,
    },
    menuTrigger: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ab1e24',
    },
    menuTriggerText: {
        color: '#f7fffd',
        fontFamily: 'Manrope_700Bold',
        fontSize: 18,
    },
    headerTitleWrap: {
        flex: 1,
        paddingHorizontal: 12,
    },
    headerTitle: {
        color: '#6f1519',
        fontFamily: 'Manrope_700Bold',
        fontSize: 16,
    },
    headerSubtitle: {
        color: '#8b3a3f',
        fontFamily: 'Manrope_400Regular',
        fontSize: 12,
        marginTop: 2,
    },
    headerDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#ab1e24',
    },
    drawerBackdrop: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(80, 20, 24, 0.3)',
        zIndex: 2,
    },
    drawerPanel: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 280,
        backgroundColor: '#7f1b21',
        paddingTop: 110,
        paddingHorizontal: 16,
        gap: 10,
        zIndex: 4,
    },
    drawerTitle: {
        color: '#ffe6e7',
        fontFamily: 'Manrope_700Bold',
        fontSize: 15,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    drawerItem: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cf7f83',
        backgroundColor: '#962028',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    drawerItemActive: {
        backgroundColor: '#f5d7d9',
        borderColor: '#efc5c7',
    },
    drawerItemText: {
        color: '#ebfffb',
        fontFamily: 'Manrope_700Bold',
        fontSize: 14,
    },
    drawerItemTextActive: {
        color: '#7f1b21',
    },
    drawerGroupWrap: {
        gap: 8,
    },
    drawerGroupHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    drawerGroupChevron: {
        color: '#ebfffb',
        fontFamily: 'Manrope_700Bold',
        fontSize: 14,
    },
    drawerGroupChevronActive: {
        color: '#7f1b21',
    },
    drawerSubItemWrap: {
        paddingLeft: 12,
        gap: 8,
    },
    drawerSubItem: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cf7f83',
        backgroundColor: '#8e1f26',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    drawerSubItemActive: {
        backgroundColor: '#f8e3e5',
        borderColor: '#efc5c7',
    },
    drawerSubItemText: {
        color: '#ebfffb',
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
    },
    drawerSubItemTextActive: {
        color: '#7f1b21',
    },
    languageSection: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#cf7f83',
        paddingTop: 14,
        gap: 8,
    },
    languageTitle: {
        color: '#ffd9db',
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    languageRow: {
        flexDirection: 'row',
        gap: 8,
    },
    languageChip: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cf7f83',
        backgroundColor: '#962028',
    },
    languageChipActive: {
        backgroundColor: '#ab1e24',
        borderColor: '#e4afb0',
    },
    languageChipText: {
        color: '#ebfffb',
        fontFamily: 'Manrope_700Bold',
        fontSize: 12,
    },
});
//# sourceMappingURL=HeaderDrawer.styles.js.map