import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  listBlock: {
    gap: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 12,
  },
  title: {
    color: '#7a181d',
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    color: '#8d5458',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  docEmpty: {
    color: '#a06a6f',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  docItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#edd4d5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  docItemTitle: {
    color: '#7a2328',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  docItemMeta: {
    color: '#996165',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
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
