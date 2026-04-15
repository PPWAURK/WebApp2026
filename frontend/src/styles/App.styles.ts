import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ab1e24',
  },
  authenticatedPage: {
    backgroundColor: '#f6efe8',
  },
  appFrame: {
    flex: 1,
  },
  authenticatedAppFrame: {
    backgroundColor: '#f6efe8',
  },
  safeArea: {
    flex: 1,
  },
  authenticatedSafeArea: {
    backgroundColor: '#f6efe8',
  },
  keyboardAreaContent: {
    flex: 1,
    zIndex: 1,
  },
  authenticatedKeyboardArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18,
  },
  contentWithHeader: {
    paddingTop: 12,
  },
  authenticatedContent: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingBottom: 32,
    ...Platform.select({
      // On wide web screens, cap content width so it doesn't stretch beyond readable limits.
      // maxWidth alone (without margin auto) anchors content to the left, which is intentional
      // since the sidebar is on the left — asymmetric margins would look odd.
      web: { maxWidth: 1600 } as never,
      default: {},
    }),
  },
  pageTransitionLayer: {
    flex: 1,
  },
  loginLoaderFullscreen: {
    flex: 1,
    backgroundColor: '#b51e24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLoaderCard: {
    width: 620,
    maxWidth: '96%',
    borderRadius: 34,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  loginLoaderText: {
    color: '#f2e0cb',
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  loaderPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ab1e24',
  },
});
