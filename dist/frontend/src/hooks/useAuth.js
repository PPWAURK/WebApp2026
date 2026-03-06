"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const authApi_1 = require("../services/authApi");
const restaurantsApi_1 = require("../services/restaurantsApi");
const sessionStorage_1 = require("../services/sessionStorage");
const AuthContext = (0, react_1.createContext)(null);
function mapAuthErrorMessage(rawMessage, currentMode, text) {
    if (rawMessage === text.auth.restaurantMissing || rawMessage.includes('RESTAURANT_REQUIRED')) {
        return text.auth.restaurantMissing;
    }
    if (rawMessage.includes('ACCOUNT_PENDING_APPROVAL')) {
        return text.auth.pendingApprovalRequired;
    }
    if (rawMessage.includes('INVALID_EMAIL')) {
        return text.auth.invalidEmail;
    }
    if (rawMessage.includes('USER_NOT_FOUND')) {
        return text.auth.userNotFound;
    }
    if (rawMessage.includes('INCORRECT_PASSWORD')) {
        return text.auth.incorrectPassword;
    }
    if (rawMessage.includes('EMAIL_ALREADY_REGISTERED')) {
        return text.auth.emailAlreadyRegistered;
    }
    if (rawMessage.includes('PASSWORD_TOO_SHORT')) {
        return text.auth.passwordTooShort;
    }
    return currentMode === 'login' ? text.auth.loginFailed : text.auth.registerFailed;
}
function AuthProvider({ children }) {
    const [isLoadingSession, setIsLoadingSession] = (0, react_1.useState)(true);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [mode, setMode] = (0, react_1.useState)('login');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [name, setName] = (0, react_1.useState)('');
    const [restaurants, setRestaurants] = (0, react_1.useState)([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = (0, react_1.useState)(null);
    const [rememberMe, setRememberMe] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [notice, setNotice] = (0, react_1.useState)(null);
    const [forgotPasswordCooldownSeconds, setForgotPasswordCooldownSeconds] = (0, react_1.useState)(0);
    const [session, setSession] = (0, react_1.useState)(null);
    const [postLoginAnimationPending, setPostLoginAnimationPending] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        async function initSession() {
            try {
                const stored = await (0, sessionStorage_1.loadStoredSession)();
                setRememberMe(stored.rememberMe);
                setSession(stored.session);
            }
            catch {
                setSession(null);
            }
            finally {
                setIsLoadingSession(false);
            }
        }
        void initSession();
    }, []);
    (0, react_1.useEffect)(() => {
        if (forgotPasswordCooldownSeconds <= 0) {
            return;
        }
        const intervalId = setInterval(() => {
            setForgotPasswordCooldownSeconds((currentValue) => currentValue > 1 ? currentValue - 1 : 0);
        }, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [forgotPasswordCooldownSeconds]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        void (0, restaurantsApi_1.fetchRestaurants)()
            .then((result) => {
            if (!isActive) {
                return;
            }
            setRestaurants(result);
            if (result.length > 0) {
                setSelectedRestaurantId((current) => current ?? result[0].id);
            }
        })
            .catch(() => {
            if (isActive) {
                setRestaurants([]);
                setSelectedRestaurantId(null);
            }
        });
        return () => {
            isActive = false;
        };
    }, []);
    async function submitAuth(currentMode, text, language) {
        setIsSubmitting(true);
        setError(null);
        setNotice(null);
        try {
            if (currentMode === 'register' && !selectedRestaurantId) {
                throw new Error(text.auth.restaurantMissing);
            }
            const authData = await (0, authApi_1.requestAuth)(currentMode, {
                email: email.trim(),
                password,
                name: currentMode === 'register' ? name.trim() : undefined,
                restaurantId: currentMode === 'register' && selectedRestaurantId ? selectedRestaurantId : undefined,
                language,
            });
            if (currentMode === 'register') {
                const registerData = authData;
                if (registerData.pendingApproval) {
                    setMode('login');
                    setPassword('');
                    setNotice(text.auth.pendingApprovalSubmitted);
                    return;
                }
            }
            const loginData = authData;
            setSession(loginData);
            setPostLoginAnimationPending(true);
            await (0, sessionStorage_1.persistSession)(loginData, rememberMe);
            setPassword('');
        }
        catch (requestError) {
            if (requestError instanceof Error) {
                setError(mapAuthErrorMessage(requestError.message, currentMode, text));
            }
            else {
                setError(currentMode === 'login' ? text.auth.loginFailed : text.auth.registerFailed);
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function forgotPassword(text, language) {
        if (forgotPasswordCooldownSeconds > 0) {
            return;
        }
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            setError(text.auth.invalidEmail);
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setNotice(null);
        try {
            await (0, authApi_1.requestForgotPassword)(normalizedEmail, language);
            setNotice(text.auth.resetEmailSent);
            setForgotPasswordCooldownSeconds(30);
        }
        catch (requestError) {
            if (requestError instanceof Error && requestError.message.includes('INVALID_EMAIL')) {
                setError(text.auth.invalidEmail);
            }
            else {
                setError(text.auth.resetEmailFailed);
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function logout() {
        await (0, sessionStorage_1.clearSession)();
        setSession(null);
        setEmail('');
        setPassword('');
        setName('');
        setMode('login');
        setError(null);
        setNotice(null);
        setForgotPasswordCooldownSeconds(0);
        setPostLoginAnimationPending(false);
    }
    function toggleMode() {
        setError(null);
        setNotice(null);
        setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
    }
    async function updateSessionUser(user) {
        setSession((currentSession) => {
            if (!currentSession) {
                return currentSession;
            }
            const nextSession = {
                ...currentSession,
                user,
            };
            void (0, sessionStorage_1.persistSession)(nextSession, rememberMe);
            return nextSession;
        });
    }
    function consumePostLoginAnimation() {
        setPostLoginAnimationPending(false);
    }
    return (<AuthContext.Provider value={{
            isLoadingSession,
            isSubmitting,
            mode,
            email,
            password,
            name,
            rememberMe,
            error,
            notice,
            forgotPasswordCooldownSeconds,
            session,
            restaurants,
            selectedRestaurantId,
            setEmail,
            setPassword,
            setName,
            setSelectedRestaurantId,
            setRememberMe,
            submitAuth,
            forgotPassword,
            logout,
            toggleMode,
            updateSessionUser,
            postLoginAnimationPending,
            consumePostLoginAnimation,
        }}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
//# sourceMappingURL=useAuth.js.map