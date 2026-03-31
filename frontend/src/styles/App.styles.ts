import { StyleSheet } from 'react-native';

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
  staticContent: {
    flex: 1,
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
