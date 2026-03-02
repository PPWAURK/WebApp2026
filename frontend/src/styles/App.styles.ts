import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ab1e24',
  },
  appFrame: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAreaContent: {
    flex: 1,
    zIndex: 1,
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
  loaderPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ab1e24',
  },
});
