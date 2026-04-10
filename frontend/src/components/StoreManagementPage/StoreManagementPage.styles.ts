import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ead7cb',
    backgroundColor: '#fffaf6',
    padding: 20,
    gap: 8,
  },
  title: {
    color: '#6f1d1b',
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
  },
  subtitle: {
    color: '#7a5b57',
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  statusText: {
    color: '#a63a3f',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  grid: {
    gap: 18,
  },
  gridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: 18,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1.2,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ead7cb',
    backgroundColor: '#fffdfb',
    padding: 18,
    gap: 14,
  },
  cardTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  cardSubtitle: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  restaurantSelectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  restaurantChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6c8c0',
    backgroundColor: '#fff5f1',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  restaurantChipActive: {
    borderColor: '#b5484d',
    backgroundColor: '#7f1b21',
  },
  restaurantChipText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  restaurantChipTextActive: {
    color: '#fff7f5',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5d1c7',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#472a2c',
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: '#7f1b21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#fff8f6',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  emptyText: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  userCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eddcd2',
    backgroundColor: '#fff8f4',
    padding: 16,
    gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userIdentity: {
    flex: 1,
    gap: 2,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pendingCountBadge: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#7f1b21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCountText: {
    color: '#fff8f6',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  pendingSection: {
    gap: 12,
  },
  pendingSectionTitle: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  inlinePrimaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userName: {
    color: '#6f1d1b',
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  userEmail: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f7e4d9',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailText: {
    color: '#6e5552',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#decbc4',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  dangerButton: {
    borderColor: '#e4b5b7',
    backgroundColor: '#fff1f2',
  },
  dangerButtonText: {
    color: '#ab1e24',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36, 20, 22, 0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    maxHeight: '80%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ead7cb',
    backgroundColor: '#fffdfb',
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  levelList: {
    gap: 10,
  },
  levelOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6d5cc',
    backgroundColor: '#fff8f4',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  levelOptionActive: {
    borderColor: '#b5484d',
    backgroundColor: '#7f1b21',
  },
  levelOptionText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  levelOptionTextActive: {
    color: '#fff8f6',
  },
});
