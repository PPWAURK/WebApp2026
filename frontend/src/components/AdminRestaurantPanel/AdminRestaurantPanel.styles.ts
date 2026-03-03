import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  uploadCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 10,
  },
  uploadTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  uploadSubtitle: {
    color: '#8d5458',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  uploadFieldTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
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
    backgroundColor: '#fffafa',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  uploadChipActive: {
    borderColor: '#b75d62',
    backgroundColor: '#f8e2e4',
  },
  uploadChipText: {
    color: '#8d5458',
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  uploadChipTextActive: {
    color: '#7a181d',
  },
  docEmpty: {
    color: '#a06a6f',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dfb0b2',
    backgroundColor: '#ffffff',
    color: '#7a181d',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  error: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d39a9d',
    backgroundColor: '#fffafa',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d39a9d',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#fffafa',
  },
  secondaryButtonText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});
