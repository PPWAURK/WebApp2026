import { useEffect, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { styles } from './LoginSvgLoader.styles';

const AnimatedView = Animated.createAnimatedComponent(View);

export function LoginSvgLoader() {
  const { width } = useWindowDimensions();

  // Moteurs d'animation du pendule et de la lueur.
  const swing = useRef(new Animated.Value(0)).current;

  // Taille inspiree de la lanterne de la page pre-login.
  const isSmall = width < 520;
  const isTablet = width >= 520 && width < 960;
  const pendulumWidth = isSmall ? 238 : isTablet ? 328 : 448;
  const pendulumHeight = Math.round(pendulumWidth * 0.81);
  const pendulumHalfHeight = pendulumHeight / 2;

  useEffect(() => {
    const swingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {
          toValue: 1,
          // Vitesse du balancement par demi-cycle (gauche -> droite, puis droite -> gauche).
          duration: 1480,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          toValue: 0,
          duration: 1480,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    swingLoop.start();

    return () => {
      swingLoop.stop();
    };
  }, [swing]);

  const swingRotation = swing.interpolate({
    inputRange: [0, 0.5, 1],
    // Amplitude du pendule (plus petit = plus calme, plus grand = plus dramatique).
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  return (
    <View
      style={[
        styles.wrap,
        {
          width: pendulumWidth + 52,
          height: pendulumHeight + 76,
        },
      ]}
    >
      <AnimatedView
        style={[
          styles.pendulumWrap,
          {
            width: pendulumWidth,
            height: pendulumHeight,
            transform: [
              { translateY: -pendulumHalfHeight },
              { rotate: swingRotation },
              { translateY: pendulumHalfHeight },
            ],
          },
        ]}
      >
        <Svg
          width={pendulumWidth}
          height={pendulumHeight}
          viewBox="0 0 234 258"
        >
          {/* Palette visuelle de la lanterne. */}
          <Defs>
            <LinearGradient id="lanternBody" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.surfaceBase} />
              <Stop offset="100%" stopColor={COLORS.svgLanternBottom} />
            </LinearGradient>
            <ClipPath id="lanternImageClip">
              <Rect x="45" y="75" width="155" height="155" rx="42" />
            </ClipPath>
          </Defs>

          {/* Corde suspendue: ajuste tirets/epaisseur/couleur pour changer le style. */}
          <Path
            d="M117 2 L117 76"
            stroke={COLORS.svgLanternRope}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Coque externe de la lanterne. */}
          <Rect
            x="23"
            y="72"
            width="188"
            height="150"
            rx="74"
            fill="url(#lanternBody)"
            stroke={COLORS.svgLanternBorder}
            strokeWidth="3"
          />

          {/* Une seule image en fond (entiere, sans crop). */}
          <SvgImage
            x="57"
            y="90"
            width="120"
            height="120"
            href={require('../../../assets/logo2024/logozhao正方形.jpg')}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#lanternImageClip)"
            opacity="1"
          />

          {/* Nervures fines et courbees, style lanterne traditionnelle. */}
          <Path
            d="M57 84 Q49 146 57 208"
            stroke={COLORS.svgLanternRib}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          <Path
            d="M79 80 Q73 146 79 212"
            stroke={COLORS.svgLanternRib}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.48"
          />
          <Path
            d="M117 78 Q117 146 117 214"
            stroke={COLORS.svgLanternRib}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.42"
          />
          <Path
            d="M155 80 Q161 146 155 212"
            stroke={COLORS.svgLanternRib}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.48"
          />
          <Path
            d="M177 84 Q185 146 177 208"
            stroke={COLORS.svgLanternRib}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />

          {/* Base basse et pompon. */}
          <Rect
            x="82"
            y="222"
            width="70"
            height="18"
            rx="3"
            fill={COLORS.svgLanternBase}
          />
          <Circle cx="117" cy="243" r="8" fill={COLORS.svgLanternAccent} />
        </Svg>
      </AnimatedView>
    </View>
  );
}
