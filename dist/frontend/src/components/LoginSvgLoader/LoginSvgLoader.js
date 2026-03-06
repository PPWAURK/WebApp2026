"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSvgLoader = LoginSvgLoader;
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const LoginSvgLoader_styles_1 = require("./LoginSvgLoader.styles");
const AnimatedView = react_native_1.Animated.createAnimatedComponent(react_native_1.View);
function LoginSvgLoader() {
    const { width } = (0, react_native_1.useWindowDimensions)();
    const swing = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const isSmall = width < 520;
    const isTablet = width >= 520 && width < 960;
    const pendulumWidth = isSmall ? 238 : isTablet ? 328 : 448;
    const pendulumHeight = Math.round(pendulumWidth * 0.81);
    const pendulumHalfHeight = pendulumHeight / 2;
    (0, react_1.useEffect)(() => {
        const swingLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(swing, {
                toValue: 1,
                duration: 1480,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.sin),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(swing, {
                toValue: 0,
                duration: 1480,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.sin),
                useNativeDriver: true,
            }),
        ]));
        swingLoop.start();
        return () => {
            swingLoop.stop();
        };
    }, [swing]);
    const swingRotation = swing.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-18deg', '0deg', '18deg'],
    });
    return (<react_native_1.View style={[
            LoginSvgLoader_styles_1.styles.wrap,
            {
                width: pendulumWidth + 52,
                height: pendulumHeight + 76,
            },
        ]}>
      <AnimatedView style={[
            LoginSvgLoader_styles_1.styles.pendulumWrap,
            {
                width: pendulumWidth,
                height: pendulumHeight,
                transform: [
                    { translateY: -pendulumHalfHeight },
                    { rotate: swingRotation },
                    { translateY: pendulumHalfHeight },
                ],
            },
        ]}>
        <react_native_svg_1.default width={pendulumWidth} height={pendulumHeight} viewBox="0 0 234 258">
          
          <react_native_svg_1.Defs>
            <react_native_svg_1.LinearGradient id="lanternBody" x1="0" y1="0" x2="0" y2="1">
              <react_native_svg_1.Stop offset="0%" stopColor="#ffffff"/>
              <react_native_svg_1.Stop offset="100%" stopColor="#f5f5f5"/>
            </react_native_svg_1.LinearGradient>
            <react_native_svg_1.ClipPath id="lanternImageClip">
              <react_native_svg_1.Rect x="45" y="75" width="155" height="155" rx="42"/>
            </react_native_svg_1.ClipPath>
          </react_native_svg_1.Defs>

          
          <react_native_svg_1.Path d="M117 2 L117 76" stroke="#f6d6d6" strokeWidth="4" strokeLinecap="round"/>

          
          <react_native_svg_1.Rect x="23" y="72" width="188" height="150" rx="74" fill="url(#lanternBody)" stroke="#d39fa2" strokeWidth="3"/>

          
          <react_native_svg_1.Image x="57" y="90" width="120" height="120" href={require('../../../assets/logo2024/logozhao正方形.jpg')} preserveAspectRatio="xMidYMid slice" clipPath="url(#lanternImageClip)" opacity="1"/>

          
          <react_native_svg_1.Path d="M57 84 Q49 146 57 208" stroke="#c99a9d" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55"/>
          <react_native_svg_1.Path d="M79 80 Q73 146 79 212" stroke="#c99a9d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.48"/>
          <react_native_svg_1.Path d="M117 78 Q117 146 117 214" stroke="#c99a9d" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.42"/>
          <react_native_svg_1.Path d="M155 80 Q161 146 155 212" stroke="#c99a9d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.48"/>
          <react_native_svg_1.Path d="M177 84 Q185 146 177 208" stroke="#c99a9d" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55"/>

          
          <react_native_svg_1.Rect x="82" y="222" width="70" height="18" rx="3" fill="#d9a4a7"/>
          <react_native_svg_1.Circle cx="117" cy="243" r="8" fill="#bb262d"/>
        </react_native_svg_1.default>
      </AnimatedView>
    </react_native_1.View>);
}
//# sourceMappingURL=LoginSvgLoader.js.map