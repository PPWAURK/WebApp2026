import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Emprise globale du loader (la carte doit etre assez grande pour eviter le rognage pendant le balancement).
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pendulumWrap: {
    // Conteneur de la lanterne en balancement (doit correspondre a la largeur/hauteur SVG de LoginSvgLoader.tsx).
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
