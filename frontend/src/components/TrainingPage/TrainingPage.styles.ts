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
  trainingTabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  trainingTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dfb0b2',
    backgroundColor: '#f9ebec',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trainingTabActive: {
    backgroundColor: '#ab1e24',
    borderColor: '#ab1e24',
  },
  trainingTabText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  trainingTabTextActive: {
    color: '#ffffff',
  },
  docBlock: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4c3c5',
    backgroundColor: '#fff7f7',
    padding: 12,
    gap: 8,
  },
  docBlockTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
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
  docItemLink: {
    color: '#ab1e24',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  error: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
