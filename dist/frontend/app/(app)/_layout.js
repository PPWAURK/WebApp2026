"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AppGroupLayout;
const expo_router_1 = require("expo-router");
const react_native_1 = require("react-native");
const useAuth_1 = require("../../src/hooks/useAuth");
const App_styles_1 = require("../../src/styles/App.styles");
function AppGroupLayout() {
    const auth = (0, useAuth_1.useAuth)();
    if (auth.isLoadingSession) {
        return (<react_native_1.SafeAreaView style={App_styles_1.styles.loaderPage}>
        <react_native_1.ActivityIndicator size="large" color="#ab1e24"/>
      </react_native_1.SafeAreaView>);
    }
    if (!auth.session) {
        return <expo_router_1.Redirect href="/login"/>;
    }
    return <expo_router_1.Stack screenOptions={{ headerShown: false }}/>;
}
//# sourceMappingURL=_layout.js.map