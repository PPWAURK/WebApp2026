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
  uploadFieldTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  productInfoColumn: {
    flex: 1,
    gap: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productGridItem: {
    width: '48%',
  },
  productImageFrame: {
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f3dcdd',
  },
  productImageThumb: {
    width: '100%',
    height: '100%',
  },
  restaurantSelectTrigger: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0b8ba',
    backgroundColor: '#fff7f7',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantSelectTriggerText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  restaurantSelectChevron: {
    color: '#ab1e24',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  restaurantSelectList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0b8ba',
    backgroundColor: '#fff7f7',
    overflow: 'hidden',
  },
  restaurantSelectItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#efd8d9',
  },
  restaurantSelectItemActive: {
    backgroundColor: '#ab1e24',
  },
  restaurantSelectItemText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  restaurantSelectItemTextActive: {
    color: '#ffffff',
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
