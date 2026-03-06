"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthLandingScreen;
const manrope_1 = require("@expo-google-fonts/manrope");
const expo_router_1 = require("expo-router");
const react_native_1 = require("react-native");
const PreLoginHome_1 = require("../../src/components/PreLoginHome");
const useLanguage_1 = require("../../src/hooks/useLanguage");
const App_styles_1 = require("../../src/styles/App.styles");
function AuthLandingScreen() {
    const router = (0, expo_router_1.useRouter)();
    const language = (0, useLanguage_1.useLanguage)();
    const [fontsLoaded] = (0, manrope_1.useFonts)({
        Manrope_400Regular: manrope_1.Manrope_400Regular,
        Manrope_700Bold: manrope_1.Manrope_700Bold,
    });
    if (!fontsLoaded || language.isLoadingLanguage) {
        return (<react_native_1.SafeAreaView style={App_styles_1.styles.loaderPage}>
        <react_native_1.ActivityIndicator size="large" color="#ab1e24"/>
      </react_native_1.SafeAreaView>);
    }
    return (<react_native_1.View style={App_styles_1.styles.page}>
      <react_native_1.SafeAreaView style={App_styles_1.styles.safeArea}>
        <PreLoginHome_1.PreLoginHome text={language.text} onStart={() => {
            router.replace('/login');
        }}/>
      </react_native_1.SafeAreaView>
    </react_native_1.View>);
}
//# sourceMappingURL=index.js.map