import { StyleSheet } from 'react-native';

const RED = '#ab1e24';

export const styles = StyleSheet.create({
  card: {
    width: '86%',
    maxWidth: 460,
    backgroundColor: '#f2f2f2',
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
    borderColor: '#d9a7aa',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 40,
  },
  inputFocused: {
    borderColor: RED,
  },
  input: {
    flex: 1,
    height: 40,
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
    borderRadius: 6,
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
    paddingVertical: 6,
  },
  linkText: {
    color: RED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
