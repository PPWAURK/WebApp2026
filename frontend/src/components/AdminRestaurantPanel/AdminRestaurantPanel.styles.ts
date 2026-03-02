import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  uploadCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 10,
  },
  uploadTitle: {
    color: '#7a181d',
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  uploadSubtitle: {
    color: '#8b4a4f',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  uploadFieldTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  uploadChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  uploadChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dfb0b2',
    backgroundColor: '#f9ebec',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  uploadChipActive: {
    backgroundColor: '#ab1e24',
    borderColor: '#ab1e24',
  },
  uploadChipText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  uploadChipTextActive: {
    color: '#ffffff',
  },
  docEmpty: {
    color: '#a06a6f',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4bcbf',
    backgroundColor: '#fff9f9',
    color: '#4f1c20',
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  error: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#ab1e24',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#f7fffd',
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d39a9d',
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});
