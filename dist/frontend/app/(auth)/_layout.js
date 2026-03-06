"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthGroupLayout;
const expo_router_1 = require("expo-router");
const react_native_1 = require("react-native");
const useAuth_1 = require("../../src/hooks/useAuth");
const App_styles_1 = require("../../src/styles/App.styles");
function AuthGroupLayout() {
    const auth = (0, useAuth_1.useAuth)();
    const pathname = (0, expo_router_1.usePathname)();
    if (auth.isLoadingSession) {
        return (<react_native_1.SafeAreaView style={App_styles_1.styles.loaderPage}>
        <react_native_1.ActivityIndicator size="large" color="#ab1e24"/>
      </react_native_1.SafeAreaView>);
    }
    if (auth.session && !(pathname === '/login' && auth.postLoginAnimationPending)) {
        return <expo_router_1.Redirect href="/dashboard"/>;
    }
    return <expo_router_1.Stack screenOptions={{ headerShown: false }}/>;
}
//# sourceMappingURL=_layout.js.map