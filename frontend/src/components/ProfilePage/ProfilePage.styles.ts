import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8c3c4',
    gap: 12,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarFrame: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3dcdd',
    borderWidth: 1,
    borderColor: '#dfb0b2',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarFallback: {
    color: '#7f1b21',
    fontFamily: 'Manrope_700Bold',
    fontSize: 28,
  },
  profileHeaderMeta: {
    flex: 1,
    gap: 4,
  },
  nameEditorBlock: {
    marginTop: 4,
    gap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#dfb0b2',
    borderRadius: 12,
    backgroundColor: '#fff7f7',
    color: '#7f1b21',
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  primaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ab1e24',
    backgroundColor: '#ab1e24',
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  error: {
    color: '#b42318',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.65,
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
