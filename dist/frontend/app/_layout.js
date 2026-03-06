"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
const expo_router_1 = require("expo-router");
const useAuth_1 = require("../src/hooks/useAuth");
const useLanguage_1 = require("../src/hooks/useLanguage");
function RootLayout() {
    return (<useLanguage_1.LanguageProvider>
      <useAuth_1.AuthProvider>
        <expo_router_1.Stack screenOptions={{ headerShown: false, animation: 'none' }}/>
      </useAuth_1.AuthProvider>
    </useLanguage_1.LanguageProvider>);
}
//# sourceMappingURL=_layout.js.map