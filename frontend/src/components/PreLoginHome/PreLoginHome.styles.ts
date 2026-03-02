import { StyleSheet } from 'react-native';

const BG = '#B51E24';
const CREAM = '#E9DDC8';
const RED = '#B51E24';
const BASE = '#D9A4A7';
const WHITE = '#F4F4F4';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  decorImage: {
    position: 'absolute',
    resizeMode: 'contain',
  },
  centerStack: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    position: 'relative',
  },
  stringWrap: {
    position: 'absolute',
    bottom: '100%',
    alignItems: 'center',
  },
  stringWaveWrap: {
    alignItems: 'center',
    paddingTop: 2,
  },
  waveDot: {
    width: 5,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(246, 214, 214, 0.96)',
    marginTop: -1,
  },
  lanternWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  lantern: {
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  base: {
    height: 24,
    backgroundColor: BASE,
    borderRadius: 2,
    marginTop: 2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 40,
    paddingVertical: 14,
    paddingLeft: 26,
    paddingRight: 16,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 34,
  },
  ctaText: {
    color: RED,
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
  },
  playWrap: {
    position: 'absolute',
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: RED,
    marginLeft: 2,
  },
});
