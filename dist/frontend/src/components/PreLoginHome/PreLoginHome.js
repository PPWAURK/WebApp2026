"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreLoginHome = PreLoginHome;
const react_native_1 = require("react-native");
const PreLoginHome_styles_1 = require("./PreLoginHome.styles");
const DECOR_ITEMS = [
    {
        key: 'pattern-1',
        source: require('../../../assets/ZHAO-元素element/图案图形/白色/1.png'),
        small: { x: 13, y: 6, width: 80, height: 80, opacity: 0.5 },
        tablet: { x: 11, y: 10, width: 180, height: 100, opacity: 0.75 },
        desktop: { x: 12, y: 11, width: 250, height: 120, opacity: 0.75 },
    },
    {
        key: 'pattern-3',
        source: require('../../../assets/ZHAO-元素element/图案图形/白色/3.png'),
        small: { x: 50, y: 95, width: 75, height: 70, opacity: 0.5 },
        tablet: { x: 50, y: 92, width: 100, height: 120, opacity: 0.65 },
        desktop: { x: 94, y: 86, width: 150, height: 120, opacity: 0.75 },
    },
    {
        key: 'txt-325',
        source: require('../../../assets/ZHAO-元素element/文字/白色字体/未标题-3-25.png'),
        small: { x: 25, y: 20, width: 100, height: 120, opacity: 0.45 },
        tablet: { x: 18, y: 25, width: 180, height: 100, opacity: 0.65 },
        desktop: { x: 25, y: 25, width: 220, height: 450, opacity: 0.65 },
    },
    {
        key: 'txt-302',
        source: require('../../../assets/ZHAO-元素element/文字/白色字体/未标题-3-03.png'),
        small: { x: 80, y: 20, width: 118, height: 80, opacity: 0.44 },
        tablet: { x: 75, y: 20, width: 180, height: 100, opacity: 0.6 },
        desktop: { x: 74, y: 12, width: 355, height: 155, opacity: 0.6 },
    },
    {
        key: 'pattern-4',
        source: require('../../../assets/ZHAO-元素element/图案图形/白色/4.png'),
        small: { x: 85, y: 5, width: 80, height: 80, opacity: 0.53 },
        tablet: { x: 90, y: 8, width: 100, height: 100, opacity: 0.6 },
        desktop: { x: 92, y: 15, width: 130, height: 260, opacity: 0.75 },
    },
    {
        key: 'txt-318-alt',
        source: require('../../../assets/ZHAO-元素element/文字/白色字体/未标题-3-18.png'),
        small: { x: 80, y: 60, width: 120, height: 120, opacity: 0.35 },
        tablet: { x: 80, y: 62, width: 220, height: 120, opacity: 0.55 },
        desktop: { x: 85, y: 42, width: 370, height: 256, opacity: 0.55 },
    },
    {
        key: 'txt-318',
        source: require('../../../assets/ZHAO-元素element/文字/白色字体/未标题-3-06.png'),
        small: { x: 25, y: 80, width: 150, height: 80, opacity: 0.38 },
        tablet: { x: 18, y: 80, width: 180, height: 150, opacity: 0.58 },
        desktop: { x: 20, y: 75, width: 550, height: 300, opacity: 0.58 },
    },
    {
        key: 'txt-306',
        source: require('../../../assets/ZHAO-元素element/文字/白色字体/未标题-3-02.png'),
        small: { x: 70, y: 86, width: 120, height: 80, opacity: 0.38 },
        tablet: { x: 78, y: 85, width: 180, height: 120, opacity: 0.56 },
        desktop: { x: 80, y: 75, width: 550, height: 150, opacity: 0.56 },
    },
    {
        key: 'pattern-6',
        source: require('../../../assets/ZHAO-元素element/图案图形/白色/6.png'),
        small: { x: 15, y: 60, width: 80, height: 80, opacity: 0.55 },
        tablet: { x: 15, y: 60, width: 180, height: 100, opacity: 0.65 },
        desktop: { x: 11, y: 45, width: 150, height: 126, opacity: 0.75 },
    },
];
function PreLoginHome(props) {
    const { width } = (0, react_native_1.useWindowDimensions)();
    const isSmall = width < 520;
    const isTablet = width >= 520 && width < 960;
    const lanternWidth = isSmall ? 260 : isTablet ? 360 : 489;
    const lanternHeight = Math.round(lanternWidth * 0.81);
    const ctaWidth = isSmall ? 230 : 270;
    const waveCount = isSmall ? 48 : 56;
    const lanternOffset = isSmall ? 72 : isTablet ? 98 : 130;
    const decorPreset = isSmall ? 'small' : isTablet ? 'tablet' : 'desktop';
    return (<react_native_1.View style={PreLoginHome_styles_1.styles.container}>
      <react_native_1.View style={PreLoginHome_styles_1.styles.decorLayer} pointerEvents="none">
        {DECOR_ITEMS.map((item) => {
            const layout = item[decorPreset];
            return (<react_native_1.Image key={item.key} source={item.source} resizeMode="contain" style={[
                    PreLoginHome_styles_1.styles.decorImage,
                    {
                        left: `${layout.x}%`,
                        top: `${layout.y}%`,
                        width: layout.width,
                        height: layout.height,
                        marginLeft: -layout.width / 2,
                        marginTop: -layout.height / 2,
                        opacity: layout.opacity,
                    },
                ]}/>);
        })}
      </react_native_1.View>

      <react_native_1.View style={PreLoginHome_styles_1.styles.centerStack}>
        <react_native_1.View style={[PreLoginHome_styles_1.styles.lanternWrap, { marginBottom: lanternOffset }]}>
          <react_native_1.View pointerEvents="none" style={PreLoginHome_styles_1.styles.stringWrap}>
            <react_native_1.View style={PreLoginHome_styles_1.styles.stringWaveWrap}>
              {Array.from({ length: waveCount }).map((_, index) => (<react_native_1.View key={`wave-${index}`} style={[
                PreLoginHome_styles_1.styles.waveDot,
                {
                    transform: [{ translateX: Math.sin(index * 0.34) * 2.3 }],
                },
            ]}/>))}
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.View style={[
            PreLoginHome_styles_1.styles.lantern,
            {
                width: lanternWidth,
                height: lanternHeight,
                borderRadius: Math.round(lanternHeight * 0.34),
            },
        ]}>
            <react_native_1.Image source={require('../../../assets/logo2024/logo2024.jpg')} style={PreLoginHome_styles_1.styles.logoImage} resizeMode="contain"/>
          </react_native_1.View>

          <react_native_1.View style={[PreLoginHome_styles_1.styles.base, { width: lanternWidth * 0.26 }]}/>
        </react_native_1.View>

        <react_native_1.Pressable onPress={props.onStart} style={[PreLoginHome_styles_1.styles.cta, { minWidth: ctaWidth }]}>
          <react_native_1.Text style={PreLoginHome_styles_1.styles.ctaText}>{props.text.landing.primaryCta}</react_native_1.Text>
          <react_native_1.View style={PreLoginHome_styles_1.styles.playWrap}>
            <react_native_1.View style={PreLoginHome_styles_1.styles.playTriangle}/>
          </react_native_1.View>
        </react_native_1.Pressable>
      </react_native_1.View>
    </react_native_1.View>);
}
//# sourceMappingURL=PreLoginHome.js.map