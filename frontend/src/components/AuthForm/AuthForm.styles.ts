import { StyleSheet } from 'react-native';

const RED = '#ab1e24';
const BORDER = '#d9a7aa';
const LIGHT_RED = '#d86e73';
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
    gap: 10,
    alignSelf: 'center',
    height:'68%',
  },
  logo: {
    width: '100%',
    height: '15%',
    alignSelf: 'center',
    marginBottom: 6,
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
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#ffffff',
    color: RED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: INPUT_HEIGHT,
  },
  authLanguageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  authLanguageChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff7f7',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    top: 50,
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
    marginTop: 2,
  },
  rememberBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
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
    fontSize: 9,
    lineHeight: 9,
  },
  rememberLabel: {
    color: '#7e4a4e',
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },
  forgotText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
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
    borderRadius: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: INPUT_HEIGHT,
  },
  passwordInput: {
    flex: 1,
    height: INPUT_HEIGHT,
    color: RED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingVertical: 8,
  },
  eyeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 6,
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
    paddingVertical: 6,
  },
  linkText: {
    color: '#ab1e24',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },

  inputFocused: {
    borderColor: RED,
  },
});
