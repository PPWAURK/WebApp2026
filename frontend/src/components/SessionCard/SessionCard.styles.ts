import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 12,
  },
  stackCardWrap: {
    gap: 14,
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#f3dcdd',
    color: '#7f1b21',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  meta: {
    color: '#7d4a4f',
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
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
