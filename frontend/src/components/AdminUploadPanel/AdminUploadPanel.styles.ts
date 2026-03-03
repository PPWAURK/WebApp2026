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
  uploadResultBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edd3d5',
    backgroundColor: '#fffdfd',
    padding: 10,
    gap: 6,
  },
  uploadResultText: {
    color: '#7b2328',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  uploadResultLink: {
    color: '#ab1e24',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },
  uploadResultMeta: {
    color: '#91555a',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
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
});
