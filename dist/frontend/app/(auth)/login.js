"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginScreen;
const manrope_1 = require("@expo-google-fonts/manrope");
const expo_router_1 = require("expo-router");
const react_1 = require("react");
const react_native_1 = require("react-native");
const AuthForm_1 = require("../../src/components/AuthForm");
const LoginSvgLoader_1 = require("../../src/components/LoginSvgLoader");
const useAuth_1 = require("../../src/hooks/useAuth");
const useLanguage_1 = require("../../src/hooks/useLanguage");
const App_styles_1 = require("../../src/styles/App.styles");
const LOGIN_ANIMATION_DURATION_MS = 2000;
function LoginScreen() {
    const router = (0, expo_router_1.useRouter)();
    const auth = (0, useAuth_1.useAuth)();
    const language = (0, useLanguage_1.useLanguage)();
    const [isPostLoginLoading, setIsPostLoginLoading] = (0, react_1.useState)(false);
    const hasStartedPostLoginRef = (0, react_1.useRef)(false);
    const timeoutRef = (0, react_1.useRef)(null);
    const loaderOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const loaderScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0.86)).current;
    const [fontsLoaded] = (0, manrope_1.useFonts)({
        Manrope_400Regular: manrope_1.Manrope_400Regular,
        Manrope_700Bold: manrope_1.Manrope_700Bold,
    });
    (0, react_1.useEffect)(() => {
        if (!auth.session || !auth.postLoginAnimationPending) {
            hasStartedPostLoginRef.current = false;
            return;
        }
        if (hasStartedPostLoginRef.current) {
            return;
        }
        hasStartedPostLoginRef.current = true;
        setIsPostLoginLoading(true);
        loaderOpacity.setValue(0);
        loaderScale.setValue(0.86);
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(loaderOpacity, {
                toValue: 1,
                duration: 360,
                easing: react_native_1.Easing.out(react_native_1.Easing.exp),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(loaderScale, {
                toValue: 1,
                duration: 420,
                easing: react_native_1.Easing.out(react_native_1.Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();
        timeoutRef.current = setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(loaderOpacity, {
                    toValue: 0,
                    duration: 280,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.cubic),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(loaderScale, {
                    toValue: 1.04,
                    duration: 280,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                timeoutRef.current = null;
                auth.consumePostLoginAnimation();
                router.replace('/dashboard');
            });
        }, LOGIN_ANIMATION_DURATION_MS);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            loaderOpacity.stopAnimation();
            loaderScale.stopAnimation();
        };
    }, [
        auth.postLoginAnimationPending,
        auth.session?.accessToken,
        loaderOpacity,
        loaderScale,
        router,
    ]);
    if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
        return (<react_native_1.SafeAreaView style={App_styles_1.styles.loaderPage}>
        <react_native_1.ActivityIndicator size="large" color="#ab1e24"/>
      </react_native_1.SafeAreaView>);
    }
    if (isPostLoginLoading) {
        return (<react_native_1.View style={App_styles_1.styles.page}>
        <react_native_1.SafeAreaView style={App_styles_1.styles.safeArea}>
          <react_native_1.Animated.View style={[App_styles_1.styles.loginLoaderFullscreen, { opacity: loaderOpacity }]}>
            <react_native_1.Animated.View style={[
                App_styles_1.styles.loginLoaderCard,
                {
                    transform: [{ scale: loaderScale }],
                },
            ]}>
              <LoginSvgLoader_1.LoginSvgLoader />
            </react_native_1.Animated.View>
          </react_native_1.Animated.View>
        </react_native_1.SafeAreaView>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={App_styles_1.styles.page}>
      <react_native_1.SafeAreaView style={App_styles_1.styles.safeArea}>
        <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} style={App_styles_1.styles.keyboardAreaContent}>
          <react_native_1.ScrollView contentContainerStyle={App_styles_1.styles.content}>
            <AuthForm_1.AuthForm mode={auth.mode} title={auth.mode === 'login'
            ? language.text.auth.loginTitle
            : language.text.auth.registerTitle} text={language.text} language={language.language} email={auth.email} password={auth.password} name={auth.name} restaurants={auth.restaurants} selectedRestaurantId={auth.selectedRestaurantId} rememberMe={auth.rememberMe} isSubmitting={auth.isSubmitting} forgotPasswordCooldownSeconds={auth.forgotPasswordCooldownSeconds} error={auth.error} notice={auth.notice} onEmailChange={auth.setEmail} onPasswordChange={auth.setPassword} onNameChange={auth.setName} onSelectRestaurant={auth.setSelectedRestaurantId} onRememberToggle={() => {
            auth.setRememberMe((currentValue) => !currentValue);
        }} onSelectLanguage={(nextLanguage) => {
            void language.setLanguage(nextLanguage);
        }} onSubmit={() => {
            void auth.submitAuth(auth.mode, language.text, language.language);
        }} onForgotPassword={() => {
            void auth.forgotPassword(language.text, language.language);
        }} onToggleMode={auth.toggleMode} onBackToLanding={() => {
            router.replace('/');
        }}/>
          </react_native_1.ScrollView>
        </react_native_1.KeyboardAvoidingView>
      </react_native_1.SafeAreaView>
    </react_native_1.View>);
}
//# sourceMappingURL=login.js.map