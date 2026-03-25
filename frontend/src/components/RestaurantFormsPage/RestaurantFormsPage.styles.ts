import { StyleSheet } from 'react-native';

const BORDER = 'rgba(171, 30, 36, 0.18)';
const SOFT_BORDER = 'rgba(171, 30, 36, 0.14)';
const CARD = '#fffdfb';
const PANEL = '#ffffff';
const BRAND = '#ab1e24';
const BRAND_SOFT = '#fff3ef';
const TEXT = '#5f1c21';
const MUTED = '#8d5a5f';

export const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    gap: 18,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 20,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  heroMetaColumn: {
    gap: 10,
    maxWidth: '100%',
  },
  heroPill: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroPillText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  quickGuideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickGuideCard: {
    flexGrow: 1,
    minWidth: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    padding: 14,
    gap: 8,
  },
  quickGuideIndex: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  quickGuideText: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  surfaceCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 18,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sectionEyebrow: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  sectionCounter: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionCounterValue: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  listBlock: {
    gap: 12,
  },
  fileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fileCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    padding: 16,
    gap: 14,
  },
  fileCardWide: {
    width: '48.8%',
  },
  fileCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fileBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#fff8f5',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fileBadgeText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
  fileBody: {
    gap: 6,
  },
  fileName: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  fileCategory: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  fileMeta: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  openButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  openButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  emptyCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#fff8f5',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyText: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
});
