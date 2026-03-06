"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResetPasswordScreen;
const manrope_1 = require("@expo-google-fonts/manrope");
const expo_router_1 = require("expo-router");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ResetPasswordForm_1 = require("../../src/components/ResetPasswordForm");
const useLanguage_1 = require("../../src/hooks/useLanguage");
const authApi_1 = require("../../src/services/authApi");
const App_styles_1 = require("../../src/styles/App.styles");
function normalizeToken(value) {
    if (Array.isArray(value)) {
        return value[0]?.trim() || null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
}
function ResetPasswordScreen() {
    const router = (0, expo_router_1.useRouter)();
    const language = (0, useLanguage_1.useLanguage)();
    const params = (0, expo_router_1.useLocalSearchParams)();
    const token = normalizeToken(params.token);
    const [password, setPassword] = (0, react_1.useState)('');
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [notice, setNotice] = (0, react_1.useState)(null);
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
        <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} style={App_styles_1.styles.keyboardAreaContent}>
          <react_native_1.ScrollView contentContainerStyle={App_styles_1.styles.content}>
            <ResetPasswordForm_1.ResetPasswordForm text={language.text} password={password} isSubmitting={isSubmitting} error={error} notice={notice} hasToken={Boolean(token)} onPasswordChange={setPassword} onSubmit={() => {
            if (!token) {
                setError(language.text.auth.resetTokenMissing);
                return;
            }
            if (password.trim().length < 8) {
                setError(language.text.auth.passwordTooShort);
                return;
            }
            setIsSubmitting(true);
            setError(null);
            setNotice(null);
            void (0, authApi_1.requestResetPassword)(token, password)
                .then(() => {
                setPassword('');
                setNotice(language.text.auth.resetPasswordSuccess);
                setTimeout(() => {
                    router.replace('/login');
                }, 900);
            })
                .catch((requestError) => {
                if (requestError instanceof Error &&
                    requestError.message.includes('INVALID_OR_EXPIRED_RESET_TOKEN')) {
                    setError(language.text.auth.resetTokenInvalidOrExpired);
                    return;
                }
                if (requestError instanceof Error &&
                    requestError.message.includes('PASSWORD_TOO_SHORT')) {
                    setError(language.text.auth.passwordTooShort);
                    return;
                }
                setError(language.text.auth.resetPasswordFailed);
            })
                .finally(() => {
                setIsSubmitting(false);
            });
        }} onBackToLogin={() => {
            router.replace('/login');
        }}/>
          </react_native_1.ScrollView>
        </react_native_1.KeyboardAvoidingView>
      </react_native_1.SafeAreaView>
    </react_native_1.View>);
}
//# sourceMappingURL=reset-password.js.map