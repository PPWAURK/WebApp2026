import { StyleSheet } from 'react-native';

const RED = '#ab1e24';
const LIGHT_RED = '#d86e73';
const BORDER = '#d9a7aa';
const PALE_RED = '#e5b0b3';
const CARD_BG = '#f2f2f2';
const INPUT_HEIGHT = 40;

export const styles = StyleSheet.create({
  card: {
    width: '86%',
    maxWidth: 460,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 12,
    alignSelf: 'center',
  },
  logo: {
    width: '100%',
    height: 72,
    alignSelf: 'center',
    marginBottom: 4,
  },
  uploadFieldTitle: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 2,
  },
  authLanguageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  authLanguageChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fbeeee',
  },
  authLanguageChipActive: {
    borderColor: RED,
    backgroundColor: '#f3d0d1',
  },
  authLanguageChipText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  restaurantSelectWrap: {
    position: 'relative',
    gap: 8,
    zIndex: 20,
  },
  restaurantSelectTrigger: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff7f7',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantSelectTriggerText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  restaurantSelectChevron: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  restaurantSelectList: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff7f7',
    overflow: 'hidden',
    zIndex: 50,
    elevation: 8,
  },
  restaurantSelectItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#efd8d9',
  },
  restaurantSelectItemActive: {
    backgroundColor: RED,
  },
  restaurantSelectItemText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  restaurantSelectItemTextActive: {
    color: '#ffffff',
  },
  registerOptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  registerOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  registerOptionLabel: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  registerOptionHint: {
    color: '#7e4a4e',
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 16,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberBoxActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  rememberCheck: {
    color: '#ffffff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    lineHeight: 10,
  },
  rememberLabel: {
    color: '#7e4a4e',
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },
  forgotText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  forgotTextDisabled: {
    color: LIGHT_RED,
  },
  passwordWrapper: {
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
  passwordInput: {
    flex: 1,
    height: '100%',
    color: RED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingVertical: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    outlineColor: 'transparent',
    outlineWidth: 0,
  },
  eyeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonActive: {
    backgroundColor: RED,
  },
  primaryButtonDisabled: {
    backgroundColor: PALE_RED,
  },
  buttonDisabled: {
    opacity: 0.65,
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
    color: '#ab1e24',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },

  decorLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  decorImage: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});
