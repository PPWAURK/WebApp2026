import { Platform, StyleSheet } from 'react-native';

const BORDER = 'rgba(171, 30, 36, 0.18)';
const SOFT_BORDER = 'rgba(171, 30, 36, 0.14)';
const CARD = '#fffdfb';
const PANEL = '#ffffff';
const BRAND = '#ab1e24';
const BRAND_SOFT = '#fff3ef';
const TEXT = '#5f1c21';
const MUTED = '#8d5a5f';
const WEB_INPUT_RESET = Platform.select({
  web: {
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    boxShadow: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
  } as never,
  default: {},
});

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
    gap: 14,
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
  heroBadge: {
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
  heroBadgeText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroStatCard: {
    minWidth: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
  },
  heroStatValue: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    lineHeight: 28,
  },
  heroStatLabel: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  mainGrid: {
    gap: 18,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sidebarColumn: {
    gap: 18,
  },
  sidebarColumnWide: {
    width: 340,
    flexShrink: 0,
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
    gap: 18,
  },
  surfaceCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 18,
    gap: 16,
  },
  surfaceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  surfaceHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  surfaceEyebrow: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  surfaceTitle: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  surfaceSubtitle: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  surfaceCountPill: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  surfaceCountText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  supplierList: {
    gap: 10,
  },
  supplierCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    padding: 14,
  },
  supplierCardActive: {
    borderColor: BRAND,
    backgroundColor: BRAND_SOFT,
  },
  supplierCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  supplierCardTitle: {
    flex: 1,
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  supplierCardTitleActive: {
    color: BRAND,
  },
  supplierCardCount: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  supplierCardCountActive: {
    color: BRAND,
  },
  searchWrap: {
    gap: 8,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  searchInput: {
    ...WEB_INPUT_RESET,
    flex: 1,
    minWidth: 0,
    color: TEXT,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingVertical: 12,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  categoryChipActive: {
    borderColor: BRAND,
    backgroundColor: BRAND_SOFT,
  },
  categoryChipText: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: BRAND,
  },
  summaryCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 18,
    gap: 14,
  },
  summaryBottomWrap: {
    width: '100%',
  },
  summaryTitle: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryMetricLabel: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  summaryMetricValue: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listBlock: {
    gap: 12,
  },
  productGridItem: {
    width: '48.8%',
  },
  productGridItemSmall: {
    width: '100%',
  },
  productCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: PANEL,
    padding: 14,
    gap: 12,
  },
  productCardHeader: {
    gap: 8,
  },
  productBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  productBadgeText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  productInfoRowSmall: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  productInfoColumn: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  productInfoColumnSmall: {
    width: '100%',
  },
  productImageFrame: {
    width: 118,
    height: 118,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3dcdd',
  },
  productImageFrameSmall: {
    width: '100%',
    height: 190,
  },
  productImagePlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#fff7f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageThumb: {
    width: '100%',
    height: '100%',
  },
  productTitle: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  docItemMeta: {
    color: MUTED,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  priceText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
  },
  quantityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quantityButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: BRAND,
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    lineHeight: 18,
  },
  quantityValuePill: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: '#fff8f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  quantityValueLabel: {
    color: MUTED,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
  quantityValueText: {
    color: TEXT,
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    lineHeight: 20,
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
  docEmpty: {
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
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#97161c',
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
