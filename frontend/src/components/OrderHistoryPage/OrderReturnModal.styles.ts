import { StyleSheet } from 'react-native';

const BORDER = 'rgba(171, 30, 36, 0.18)';
const SOFT_BORDER = 'rgba(171, 30, 36, 0.14)';
const PANEL = '#ffffff';
const PANEL_SOFT = '#fff7f4';
const BRAND = '#ab1e24';
const TEXT = '#5f1c21';
const MUTED = '#8d5a5f';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 8, 10, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 980,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fffdfb',
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    padding: 14,
    gap: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPillText: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  content: {
    gap: 16,
    paddingBottom: 8,
  },
  formGrid: {
    gap: 14,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    color: TEXT,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  summaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    minWidth: 140,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  summaryLabel: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 24,
  },
  itemList: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    padding: 14,
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemTitle: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  itemSubtitle: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  removeButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  removeButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  itemMetaText: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  quantityRow: {
    gap: 6,
  },
  quantityInput: {
    width: 120,
  },
  photoSection: {
    gap: 10,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoSectionMeta: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },
  photoActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoActionButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoActionButtonDisabled: {
    opacity: 0.55,
  },
  photoActionButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoPreviewCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    overflow: 'hidden',
  },
  photoPreviewImage: {
    width: '100%',
    height: 140,
    backgroundColor: PANEL_SOFT,
  },
  photoPreviewFooter: {
    padding: 10,
    gap: 8,
  },
  photoPreviewName: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  photoRemoveButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoRemoveButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
  photoEmptyText: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyStateText: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    minWidth: 180,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
  },
  secondaryButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: BRAND,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
