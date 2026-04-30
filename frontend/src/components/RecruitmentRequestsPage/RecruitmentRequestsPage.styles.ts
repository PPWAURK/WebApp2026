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
  successText: {
    color: '#256d3f',
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
  card: {
    flex: 1,
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
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  fieldHint: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6c8c0',
    backgroundColor: '#fff5f1',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipActive: {
    borderColor: '#b5484d',
    backgroundColor: '#7f1b21',
  },
  optionChipText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  optionChipTextActive: {
    color: '#fff7f5',
  },
  positionNeedList: {
    gap: 10,
  },
  positionNeedRow: {
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ead7cb',
    backgroundColor: '#fff8f4',
    padding: 12,
  },
  positionNeedName: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  positionContractGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  positionContractField: {
    flexGrow: 1,
    minWidth: 132,
    gap: 6,
  },
  positionContractLabel: {
    color: '#8f6a65',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  positionNeedInput: {
    width: '100%',
    textAlign: 'center',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  requestList: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eddcd2',
    backgroundColor: '#fff8f4',
    padding: 16,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  requestTitleWrap: {
    flex: 1,
    gap: 4,
  },
  requestTitle: {
    color: '#6f1d1b',
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  requestMeta: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f7e4d9',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeProcessed: {
    backgroundColor: '#e6f4ea',
  },
  badgeText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  badgeProcessedText: {
    color: '#256d3f',
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
  notesBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ead7cb',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  notesText: {
    color: '#472a2c',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyText: {
    color: '#8f6a65',
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
});
