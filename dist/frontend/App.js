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
exports.default = App;
const manrope_1 = require("@expo-google-fonts/manrope");
const FileSystem = __importStar(require("expo-file-system/legacy"));
const Sharing = __importStar(require("expo-sharing"));
const expo_router_1 = require("expo-router");
const expo_status_bar_1 = require("expo-status-bar");
const react_1 = require("react");
const react_native_1 = require("react-native");
const AuthForm_1 = require("./src/components/AuthForm");
const HeaderDrawer_1 = require("./src/components/HeaderDrawer");
const LoginSvgLoader_1 = require("./src/components/LoginSvgLoader");
const OrderHistoryPage_1 = require("./src/components/OrderHistoryPage");
const OrderRecapPage_1 = require("./src/components/OrderRecapPage");
const OrdersPage_1 = require("./src/components/OrdersPage");
const PreLoginHome_1 = require("./src/components/PreLoginHome");
const ProfilePage_1 = require("./src/components/ProfilePage");
const ResetPasswordForm_1 = require("./src/components/ResetPasswordForm");
const RestaurantFormsPage_1 = require("./src/components/RestaurantFormsPage");
const SessionCard_1 = require("./src/components/SessionCard");
const SupplierManagementPage_1 = require("./src/components/SupplierManagementPage");
const TrainingPage_1 = require("./src/components/TrainingPage");
const useAuth_1 = require("./src/hooks/useAuth");
const useLanguage_1 = require("./src/hooks/useLanguage");
const featureFlags_1 = require("./src/constants/featureFlags");
const ordersApi_1 = require("./src/services/ordersApi");
const authSession_1 = require("./src/services/authSession");
const authApi_1 = require("./src/services/authApi");
const App_styles_1 = require("./src/styles/App.styles");
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function normalizePathname(pathname) {
    const lower = pathname.toLowerCase();
    const withLeadingSlash = lower.startsWith('/') ? lower : `/${lower}`;
    if (withLeadingSlash.length <= 1) {
        return '/';
    }
    return withLeadingSlash.replace(/\/+$/, '');
}
function pathToPreAuthRoute(pathname) {
    const normalized = normalizePathname(pathname);
    if (normalized === '/auth' ||
        normalized === '/login' ||
        normalized === '/signin') {
        return 'auth';
    }
    if (normalized === '/reset-password' ||
        normalized === '/resetpassword' ||
        normalized === '/password-reset') {
        return 'resetPassword';
    }
    return 'landing';
}
function pathToMenuPage(pathname) {
    const normalized = normalizePathname(pathname);
    if (normalized === '/profile') {
        return 'profile';
    }
    if (normalized === '/training') {
        return 'training';
    }
    if (normalized === '/restaurant-forms') {
        return 'restaurantForms';
    }
    if (normalized === '/orders') {
        return 'orders';
    }
    if (normalized === '/order-recap') {
        return 'orderRecap';
    }
    if (normalized === '/order-history') {
        return 'orderHistory';
    }
    if (normalized === '/supplier-management') {
        return 'supplierManagement';
    }
    if (normalized === '/dashboard') {
        return 'dashboard';
    }
    return null;
}
function menuPageToPath(page) {
    if (page === 'profile') {
        return '/profile';
    }
    if (page === 'training') {
        return '/training';
    }
    if (page === 'restaurantForms') {
        return '/restaurant-forms';
    }
    if (page === 'orders') {
        return '/orders';
    }
    if (page === 'orderRecap') {
        return '/order-recap';
    }
    if (page === 'orderHistory') {
        return '/order-history';
    }
    if (page === 'supplierManagement') {
        return '/supplier-management';
    }
    return '/dashboard';
}
function normalizeTokenParam(value) {
    if (Array.isArray(value)) {
        return value[0]?.trim() || null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
}
const DISABLE_POST_LOGIN_REDIRECT = false;
function App() {
    const auth = (0, useAuth_1.useAuth)();
    const language = (0, useLanguage_1.useLanguage)();
    const router = (0, expo_router_1.useRouter)();
    const pathname = (0, expo_router_1.usePathname)();
    const params = (0, expo_router_1.useLocalSearchParams)();
    const normalizedPathname = normalizePathname(pathname);
    const preAuthRoute = pathToPreAuthRoute(pathname);
    const preAuthResetToken = normalizeTokenParam(params.token);
    const activePage = pathToMenuPage(pathname) ?? 'dashboard';
    const [isDrawerOpen, setIsDrawerOpen] = (0, react_1.useState)(false);
    const [displayPage, setDisplayPage] = (0, react_1.useState)(activePage);
    const [isLoginTransitionLoading, setIsLoginTransitionLoading] = (0, react_1.useState)(false);
    const [orderRecap, setOrderRecap] = (0, react_1.useState)(null);
    const [orderQuantities, setOrderQuantities] = (0, react_1.useState)({});
    const [deliveryDate, setDeliveryDate] = (0, react_1.useState)(getTodayDateString());
    const [orderHistory, setOrderHistory] = (0, react_1.useState)([]);
    const [isLoadingOrderHistory, setIsLoadingOrderHistory] = (0, react_1.useState)(false);
    const [deletingOrderId, setDeletingOrderId] = (0, react_1.useState)(null);
    const [isSubmittingOrder, setIsSubmittingOrder] = (0, react_1.useState)(false);
    const [orderSubmitError, setOrderSubmitError] = (0, react_1.useState)(null);
    const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = (0, react_1.useState)(false);
    const [profileError, setProfileError] = (0, react_1.useState)(null);
    const [latestCreatedOrder, setLatestCreatedOrder] = (0, react_1.useState)(null);
    const scrollViewRef = (0, react_1.useRef)(null);
    const pageTransition = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const loginLoaderOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const loginLoaderScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0.86)).current;
    const loginLoaderTimeoutRef = (0, react_1.useRef)(null);
    const postLoginAnimationTokenRef = (0, react_1.useRef)(null);
    const isPostLoginAnimatingRef = (0, react_1.useRef)(false);
    const [resetPassword, setResetPassword] = (0, react_1.useState)('');
    const [isSubmittingResetPassword, setIsSubmittingResetPassword] = (0, react_1.useState)(false);
    const [resetPasswordError, setResetPasswordError] = (0, react_1.useState)(null);
    const [resetPasswordNotice, setResetPasswordNotice] = (0, react_1.useState)(null);
    function goToPreAuthLanding(replace = false) {
        if (normalizedPathname === '/') {
            return;
        }
        if (replace) {
            router.replace('/');
            return;
        }
        router.push('/');
    }
    function goToPreAuthAuth(replace = false) {
        if (normalizedPathname === '/login' || normalizedPathname === '/auth') {
            return;
        }
        if (replace) {
            router.replace('/login');
            return;
        }
        router.push('/login');
    }
    function goToMenuPage(page, replace = false) {
        const targetPath = menuPageToPath(page);
        if (normalizedPathname === targetPath) {
            return;
        }
        if (replace) {
            router.replace(targetPath);
            return;
        }
        router.push(targetPath);
    }
    (0, react_1.useEffect)(() => {
        if (react_native_1.Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }
        const styleId = 'webapp-input-browser-overrides';
        if (document.getElementById(styleId)) {
            return;
        }
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
      html[data-auth-route="true"] *:focus,
      html[data-auth-route="true"] *:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }

      html[data-auth-route="true"] input:focus-visible,
      html[data-auth-route="true"] textarea:focus-visible,
      html[data-auth-route="true"] select:focus-visible {
        outline: 2px solid #ab1e24 !important;
        outline-offset: 0 !important;
        box-shadow: none !important;
      }

      html[data-auth-route="true"] input,
      html[data-auth-route="true"] textarea,
      html[data-auth-route="true"] select {
        -webkit-tap-highlight-color: transparent !important;
        border-radius: 10px !important;
        background-clip: padding-box !important;
      }

      input:focus,
      input:focus-visible,
      input:active,
      textarea:focus,
      textarea:focus-visible,
      select:focus,
      select:focus-visible {
        outline: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input:focus:not(:focus-visible),
      textarea:focus:not(:focus-visible),
      select:focus:not(:focus-visible) {
        outline: none !important;
        box-shadow: none !important;
      }

      input[data-focus-visible-added],
      textarea[data-focus-visible-added],
      select[data-focus-visible-added] {
        outline: none !important;
        box-shadow: none !important;
      }

      input[type="email"],
      input[type="password"],
      input[type="text"],
      input[type="search"],
      input[type="tel"],
      input[type="url"],
      input[type="number"] {
        outline: none !important;
        box-shadow: none !important;
      }

      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="text"]:focus,
      input[type="search"]:focus,
      input[type="tel"]:focus,
      input[type="url"]:focus,
      input[type="number"]:focus,
      input[type="email"]:focus-visible,
      input[type="password"]:focus-visible,
      input[type="text"]:focus-visible,
      input[type="search"]:focus-visible,
      input[type="tel"]:focus-visible,
      input[type="url"]:focus-visible,
      input[type="number"]:focus-visible {
        outline: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"],
      textarea[class*="css-textinput"],
      input[class*="r-outline"],
      textarea[class*="r-outline"],
      input[class*="r-border"],
      textarea[class*="r-border"] {
        outline: none !important;
        border: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"]:focus,
      input[class*="css-textinput"]:focus-visible,
      input[class*="r-outline"]:focus,
      input[class*="r-outline"]:focus-visible,
      input[class*="r-border"]:focus,
      input[class*="r-border"]:focus-visible {
        outline: none !important;
        border: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"][data-focus-visible-added],
      input[class*="r-outline"][data-focus-visible-added],
      input[class*="r-border"][data-focus-visible-added] {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active,
      textarea:-webkit-autofill,
      textarea:-webkit-autofill:hover,
      textarea:-webkit-autofill:focus,
      textarea:-webkit-autofill:active,
      select:-webkit-autofill,
      select:-webkit-autofill:hover,
      select:-webkit-autofill:focus,
      select:-webkit-autofill:active {
        background-color: #ffffff !important;
        -webkit-text-fill-color: #ab1e24 !important;
        caret-color: #ab1e24 !important;
        -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
        box-shadow: 0 0 0 1000px #ffffff inset !important;
        transition: background-color 9999s ease-in-out 0s;
      }

      html[data-auth-route="true"] input:-webkit-autofill,
      html[data-auth-route="true"] input:-webkit-autofill:hover,
      html[data-auth-route="true"] input:-webkit-autofill:focus,
      html[data-auth-route="true"] input:-webkit-autofill:active,
      html[data-auth-route="true"] textarea:-webkit-autofill,
      html[data-auth-route="true"] textarea:-webkit-autofill:hover,
      html[data-auth-route="true"] textarea:-webkit-autofill:focus,
      html[data-auth-route="true"] textarea:-webkit-autofill:active,
      html[data-auth-route="true"] select:-webkit-autofill,
      html[data-auth-route="true"] select:-webkit-autofill:hover,
      html[data-auth-route="true"] select:-webkit-autofill:focus,
      html[data-auth-route="true"] select:-webkit-autofill:active {
        border-radius: 10px !important;
        background-color: #ffffff !important;
        -webkit-text-fill-color: #ab1e24 !important;
        caret-color: #ab1e24 !important;
        -webkit-background-clip: padding-box !important;
        -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
        box-shadow: 0 0 0 1000px #ffffff inset !important;
      }
    `;
        document.head.appendChild(styleElement);
        return () => {
            styleElement.remove();
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (react_native_1.Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }
        const root = document.documentElement;
        const isAuthRoute = preAuthRoute === 'auth' || preAuthRoute === 'resetPassword';
        if (isAuthRoute) {
            root.setAttribute('data-auth-route', 'true');
        }
        else {
            root.removeAttribute('data-auth-route');
        }
        return () => {
            root.removeAttribute('data-auth-route');
        };
    }, [preAuthRoute]);
    (0, react_1.useEffect)(() => {
        if (react_native_1.Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }
        const lockDurationMs = 450;
        const lastClickAt = new WeakMap();
        function handleWebClickCapture(event) {
            if (event.defaultPrevented) {
                return;
            }
            if (event.button !== 0) {
                return;
            }
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            const rawTarget = event.target;
            if (!(rawTarget instanceof Element)) {
                return;
            }
            const clickableTarget = rawTarget.closest('button, [role="button"], a');
            if (!clickableTarget) {
                return;
            }
            const now = Date.now();
            const previousClick = lastClickAt.get(clickableTarget);
            if (typeof previousClick === 'number' &&
                now - previousClick < lockDurationMs) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            lastClickAt.set(clickableTarget, now);
        }
        document.addEventListener('click', handleWebClickCapture, true);
        return () => {
            document.removeEventListener('click', handleWebClickCapture, true);
        };
    }, []);
    async function loadOrderHistory() {
        if (!auth.session) {
            setOrderHistory([]);
            return;
        }
        setIsLoadingOrderHistory(true);
        try {
            const result = await (0, ordersApi_1.fetchOrders)(auth.session.accessToken);
            setOrderHistory(result);
        }
        catch {
            setOrderHistory([]);
        }
        finally {
            setIsLoadingOrderHistory(false);
        }
    }
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, authSession_1.onUnauthorized)(() => {
            void auth.logout();
        });
        return unsubscribe;
    }, [auth]);
    (0, react_1.useEffect)(() => {
        return () => {
            if (loginLoaderTimeoutRef.current) {
                clearTimeout(loginLoaderTimeoutRef.current);
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (react_native_1.Platform.OS !== 'web' || typeof window === 'undefined') {
            return;
        }
        if (normalizePathname(pathname) !== '/') {
            return;
        }
        const hash = window.location.hash;
        if (!hash.startsWith('#/')) {
            return;
        }
        const [rawPath, rawQuery] = hash.slice(1).split('?');
        const normalizedHashPath = normalizePathname(rawPath || '/');
        if (normalizedHashPath === '/auth' ||
            normalizedHashPath === '/login' ||
            normalizedHashPath === '/signin') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
            router.replace('/login');
            return;
        }
        if (normalizedHashPath === '/reset-password' ||
            normalizedHashPath === '/resetpassword' ||
            normalizedHashPath === '/password-reset') {
            const hashToken = new URLSearchParams(rawQuery || '').get('token') ?? undefined;
            const normalizedHashToken = normalizeTokenParam(hashToken);
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
            if (normalizedHashToken) {
                router.replace(`/reset-password?token=${encodeURIComponent(normalizedHashToken)}`);
                return;
            }
            router.replace('/reset-password');
        }
    }, [pathname, router]);
    (0, react_1.useEffect)(() => {
        if (preAuthRoute !== 'resetPassword') {
            setResetPassword('');
            setResetPasswordError(null);
            setResetPasswordNotice(null);
            setIsSubmittingResetPassword(false);
        }
    }, [preAuthRoute]);
    (0, react_1.useEffect)(() => {
        if (auth.isLoadingSession) {
            return;
        }
        if (!auth.session) {
            if (loginLoaderTimeoutRef.current) {
                clearTimeout(loginLoaderTimeoutRef.current);
                loginLoaderTimeoutRef.current = null;
            }
            loginLoaderOpacity.stopAnimation();
            loginLoaderScale.stopAnimation();
            postLoginAnimationTokenRef.current = null;
            isPostLoginAnimatingRef.current = false;
            setIsDrawerOpen(false);
            if (pathToMenuPage(pathname) !== null) {
                goToPreAuthAuth(true);
            }
            setDisplayPage('dashboard');
            setIsLoginTransitionLoading(false);
            loginLoaderOpacity.setValue(0);
            loginLoaderScale.setValue(0.86);
            pageTransition.setValue(1);
            setOrderRecap(null);
            setOrderQuantities({});
            setDeliveryDate(getTodayDateString());
            setOrderHistory([]);
            setIsLoadingOrderHistory(false);
            setDeletingOrderId(null);
            setOrderSubmitError(null);
            setIsUploadingProfilePhoto(false);
            setProfileError(null);
            setLatestCreatedOrder(null);
            return;
        }
        if ((activePage === 'orders' ||
            activePage === 'orderRecap' ||
            activePage === 'orderHistory') &&
            auth.session.user.role !== 'ADMIN' &&
            auth.session.user.role !== 'MANAGER') {
            goToMenuPage('dashboard', true);
            setOrderRecap(null);
        }
        if (activePage === 'supplierManagement' &&
            auth.session.user.role !== 'ADMIN') {
            goToMenuPage('dashboard', true);
        }
    }, [
        activePage,
        auth.isLoadingSession,
        auth.session,
        loginLoaderOpacity,
        loginLoaderScale,
        pathname,
    ]);
    (0, react_1.useEffect)(() => {
        if (auth.isLoadingSession || !auth.session) {
            return;
        }
        if (pathToMenuPage(pathname) === null && preAuthRoute === 'landing') {
            goToMenuPage('dashboard', true);
        }
    }, [auth.isLoadingSession, auth.session, pathname, preAuthRoute]);
    (0, react_1.useEffect)(() => {
        if (!auth.session) {
            return;
        }
        if (pathToMenuPage(pathname) !== null) {
            return;
        }
        if (isPostLoginAnimatingRef.current) {
            return;
        }
        if (postLoginAnimationTokenRef.current === auth.session.accessToken) {
            return;
        }
        postLoginAnimationTokenRef.current = auth.session.accessToken;
        isPostLoginAnimatingRef.current = true;
        if (loginLoaderTimeoutRef.current) {
            clearTimeout(loginLoaderTimeoutRef.current);
            loginLoaderTimeoutRef.current = null;
        }
        setIsLoginTransitionLoading(true);
        loginLoaderOpacity.setValue(0);
        loginLoaderScale.setValue(0.86);
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(loginLoaderOpacity, {
                toValue: 1,
                duration: 360,
                easing: react_native_1.Easing.out(react_native_1.Easing.exp),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(loginLoaderScale, {
                toValue: 1,
                duration: 420,
                easing: react_native_1.Easing.out(react_native_1.Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();
        if (DISABLE_POST_LOGIN_REDIRECT) {
            return;
        }
        loginLoaderTimeoutRef.current = setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(loginLoaderOpacity, {
                    toValue: 0,
                    duration: 360,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.cubic),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(loginLoaderScale, {
                    toValue: 1.04,
                    duration: 360,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    goToMenuPage('dashboard', true);
                    setIsLoginTransitionLoading(false);
                }
                isPostLoginAnimatingRef.current = false;
            });
        }, 2000);
        return () => {
            if (loginLoaderTimeoutRef.current) {
                clearTimeout(loginLoaderTimeoutRef.current);
                loginLoaderTimeoutRef.current = null;
            }
            loginLoaderOpacity.stopAnimation();
            loginLoaderScale.stopAnimation();
            isPostLoginAnimatingRef.current = false;
        };
    }, [auth.session, loginLoaderOpacity, loginLoaderScale, pathname]);
    (0, react_1.useEffect)(() => {
        if (!auth.session) {
            return;
        }
        if (activePage === displayPage) {
            return;
        }
        pageTransition.stopAnimation();
        react_native_1.Animated.timing(pageTransition, {
            toValue: 0,
            duration: 120,
            easing: react_native_1.Easing.out(react_native_1.Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished) {
                return;
            }
            setDisplayPage(activePage);
            pageTransition.setValue(0);
            react_native_1.Animated.timing(pageTransition, {
                toValue: 1,
                duration: 200,
                easing: react_native_1.Easing.out(react_native_1.Easing.cubic),
                useNativeDriver: true,
            }).start();
        });
    }, [activePage, auth.session, displayPage, pageTransition]);
    (0, react_1.useEffect)(() => {
        if (!auth.session) {
            return;
        }
        if (auth.session.user.role !== 'ADMIN' &&
            auth.session.user.role !== 'MANAGER') {
            return;
        }
        let isActive = true;
        void (0, ordersApi_1.fetchOrders)(auth.session.accessToken)
            .then((result) => {
            if (isActive) {
                setOrderHistory(result);
            }
        })
            .catch(() => {
            if (isActive) {
                setOrderHistory([]);
            }
        });
        return () => {
            isActive = false;
        };
    }, [auth.session]);
    (0, react_1.useEffect)(() => {
        if (!auth.session || activePage !== 'orderHistory') {
            return;
        }
        void loadOrderHistory();
    }, [activePage, auth.session]);
    async function handleSubmitOrder() {
        if (!auth.session || !orderRecap) {
            return;
        }
        setIsSubmittingOrder(true);
        setOrderSubmitError(null);
        try {
            const created = await (0, ordersApi_1.createOrder)(auth.session.accessToken, {
                deliveryDate,
                items: orderRecap.items,
            });
            setLatestCreatedOrder(created);
            void handleDownloadOrderBon(created);
            await loadOrderHistory();
        }
        catch (error) {
            if (error instanceof Error && error.message.trim()) {
                setOrderSubmitError(error.message);
            }
            else {
                setOrderSubmitError(language.text.orders.submitOrderError);
            }
        }
        finally {
            setIsSubmittingOrder(false);
        }
    }
    async function handleDownloadOrderBon(order) {
        const url = (0, ordersApi_1.buildOrderBonUrl)(order.id);
        const token = auth.session?.accessToken;
        const fileName = `${order.number ?? `order-${order.id}`}.pdf`;
        if (!token) {
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(language.text.orders.downloadBonError);
            }
            else {
                react_native_1.Alert.alert(language.text.orders.downloadBonButton, language.text.orders.downloadBonError);
            }
            return;
        }
        if (react_native_1.Platform.OS === 'web') {
            try {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    (0, authSession_1.throwIfUnauthorized)(response);
                    throw new Error('ORDER_BON_DOWNLOAD_FAILED');
                }
                const blob = await response.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                const anchor = window.document.createElement('a');
                anchor.href = objectUrl;
                anchor.download = fileName;
                window.document.body.append(anchor);
                anchor.click();
                anchor.remove();
                window.URL.revokeObjectURL(objectUrl);
            }
            catch {
                if (typeof window !== 'undefined' &&
                    typeof window.alert === 'function') {
                    window.alert(language.text.orders.downloadBonError);
                }
            }
            return;
        }
        try {
            const cacheDir = FileSystem.cacheDirectory;
            if (!cacheDir) {
                throw new Error('CACHE_DIRECTORY_UNAVAILABLE');
            }
            const targetPath = `${cacheDir}${fileName}`;
            const downloadResult = await FileSystem.downloadAsync(url, targetPath, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(downloadResult.uri, {
                    dialogTitle: fileName,
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf',
                });
                return;
            }
            await react_native_1.Linking.openURL(downloadResult.uri);
        }
        catch {
            react_native_1.Alert.alert(language.text.orders.downloadBonButton, language.text.orders.downloadBonError);
        }
    }
    async function handleDeleteOrder(order) {
        if (!auth.session) {
            return;
        }
        const confirmationMessage = language.text.orders.deleteHistoryConfirm;
        const confirmed = react_native_1.Platform.OS === 'web'
            ? typeof window !== 'undefined' && window.confirm(confirmationMessage)
            : await new Promise((resolve) => {
                react_native_1.Alert.alert(language.text.orders.deleteHistoryButton, confirmationMessage, [
                    {
                        text: language.text.orders.deleteHistoryCancel,
                        style: 'cancel',
                        onPress: () => resolve(false),
                    },
                    {
                        text: language.text.orders.deleteHistoryConfirmButton,
                        style: 'destructive',
                        onPress: () => resolve(true),
                    },
                ], { cancelable: true, onDismiss: () => resolve(false) });
            });
        if (!confirmed) {
            return;
        }
        setDeletingOrderId(order.id);
        setOrderSubmitError(null);
        try {
            await (0, ordersApi_1.deleteOrder)(auth.session.accessToken, order.id);
            setOrderHistory((currentOrders) => currentOrders.filter((currentOrder) => currentOrder.id !== order.id));
        }
        catch (error) {
            if (error instanceof Error && error.message.trim()) {
                setOrderSubmitError(error.message);
            }
            else {
                setOrderSubmitError(language.text.orders.deleteHistoryError);
            }
        }
        finally {
            setDeletingOrderId(null);
        }
    }
    const [fontsLoaded] = (0, manrope_1.useFonts)({
        Manrope_400Regular: manrope_1.Manrope_400Regular,
        Manrope_700Bold: manrope_1.Manrope_700Bold,
    });
    const shouldShowPostLoginLoader = isLoginTransitionLoading && !DISABLE_POST_LOGIN_REDIRECT;
    function handleProceedToOrderRecap(recap) {
        setOrderRecap(recap);
        setLatestCreatedOrder(null);
        goToMenuPage('orderRecap');
    }
    function renderOrderBuilder() {
        if (!auth.session) {
            return null;
        }
        return (<OrdersPage_1.OrdersPage text={language.text} accessToken={auth.session.accessToken} language={language.language} quantities={orderQuantities} onQuantitiesChange={setOrderQuantities} onSubmitOrder={handleProceedToOrderRecap}/>);
    }
    function renderPublicContent() {
        if (preAuthRoute === 'landing') {
            return (<PreLoginHome_1.PreLoginHome text={language.text} onStart={() => goToPreAuthAuth()}/>);
        }
        if (preAuthRoute === 'resetPassword') {
            return (<react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} style={App_styles_1.styles.keyboardAreaContent}>
          <react_native_1.ScrollView ref={scrollViewRef} contentContainerStyle={App_styles_1.styles.content}>
            <ResetPasswordForm_1.ResetPasswordForm text={language.text} password={resetPassword} isSubmitting={isSubmittingResetPassword} error={resetPasswordError} notice={resetPasswordNotice} hasToken={Boolean(preAuthResetToken)} onPasswordChange={setResetPassword} onSubmit={() => {
                    if (!preAuthResetToken) {
                        setResetPasswordError(language.text.auth.resetTokenMissing);
                        return;
                    }
                    if (resetPassword.trim().length < 8) {
                        setResetPasswordError(language.text.auth.passwordTooShort);
                        return;
                    }
                    setIsSubmittingResetPassword(true);
                    setResetPasswordError(null);
                    setResetPasswordNotice(null);
                    void (0, authApi_1.requestResetPassword)(preAuthResetToken, resetPassword)
                        .then(() => {
                        setResetPassword('');
                        setResetPasswordNotice(language.text.auth.resetPasswordSuccess);
                        setTimeout(() => {
                            goToPreAuthAuth(true);
                        }, 900);
                    })
                        .catch((error) => {
                        if (error instanceof Error &&
                            error.message.includes('INVALID_OR_EXPIRED_RESET_TOKEN')) {
                            setResetPasswordError(language.text.auth.resetTokenInvalidOrExpired);
                            return;
                        }
                        if (error instanceof Error &&
                            error.message.includes('PASSWORD_TOO_SHORT')) {
                            setResetPasswordError(language.text.auth.passwordTooShort);
                            return;
                        }
                        setResetPasswordError(language.text.auth.resetPasswordFailed);
                    })
                        .finally(() => {
                        setIsSubmittingResetPassword(false);
                    });
                }} onBackToLogin={() => goToPreAuthAuth(true)}/>
          </react_native_1.ScrollView>
        </react_native_1.KeyboardAvoidingView>);
        }
        return (<react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} style={App_styles_1.styles.keyboardAreaContent}>
        <react_native_1.ScrollView ref={scrollViewRef} contentContainerStyle={App_styles_1.styles.content}>
          <AuthForm_1.AuthForm mode={auth.mode} title={auth.mode === 'login'
                ? language.text.auth.loginTitle
                : language.text.auth.registerTitle} text={language.text} language={language.language} email={auth.email} password={auth.password} name={auth.name} restaurants={auth.restaurants} selectedRestaurantId={auth.selectedRestaurantId} rememberMe={auth.rememberMe} isSubmitting={auth.isSubmitting} forgotPasswordCooldownSeconds={auth.forgotPasswordCooldownSeconds} error={auth.error} notice={auth.notice} onEmailChange={auth.setEmail} onPasswordChange={auth.setPassword} onNameChange={auth.setName} onSelectRestaurant={auth.setSelectedRestaurantId} onRememberToggle={() => auth.setRememberMe((currentValue) => !currentValue)} onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
            }} onSubmit={() => void auth.submitAuth(auth.mode, language.text, language.language)} onForgotPassword={() => void auth.forgotPassword(language.text, language.language)} onToggleMode={auth.toggleMode} onBackToLanding={() => goToPreAuthLanding()}/>
        </react_native_1.ScrollView>
      </react_native_1.KeyboardAvoidingView>);
    }
    if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
        return (<react_native_1.SafeAreaView style={App_styles_1.styles.loaderPage}>
        <react_native_1.ActivityIndicator size="large" color="#ab1e24"/>
      </react_native_1.SafeAreaView>);
    }
    function renderAuthenticatedContent(page) {
        if (!auth.session) {
            return null;
        }
        const canAccessOrders = auth.session.user.role === 'ADMIN' ||
            auth.session.user.role === 'MANAGER';
        if (page === 'training') {
            const TrainingPageComponent = featureFlags_1.TRAINING_FEATURE_FLAGS.ENABLE_TRAINING_V2
                ? TrainingPage_1.TrainingPage
                : TrainingPage_1.TrainingPageLegacy;
            return (<TrainingPageComponent text={language.text} language={language.language} accessToken={auth.session.accessToken} currentUser={auth.session.user}/>);
        }
        if (page === 'profile') {
            return (<ProfilePage_1.ProfilePage text={language.text} user={auth.session.user} accessToken={auth.session.accessToken} isUploadingPhoto={isUploadingProfilePhoto} error={profileError} onUploadStart={() => {
                    setProfileError(null);
                    setIsUploadingProfilePhoto(true);
                }} onUploadFinish={() => {
                    setIsUploadingProfilePhoto(false);
                }} onUploadError={setProfileError} onUserUpdate={(nextUser) => {
                    void auth.updateSessionUser(nextUser);
                }}/>);
        }
        if (page === 'restaurantForms') {
            return (<RestaurantFormsPage_1.RestaurantFormsPage text={language.text} accessToken={auth.session.accessToken} currentUser={auth.session.user}/>);
        }
        if (page === 'orders') {
            return canAccessOrders ? renderOrderBuilder() : null;
        }
        if (page === 'orderRecap') {
            if (!orderRecap) {
                return renderOrderBuilder();
            }
            return (<OrderRecapPage_1.OrderRecapPage text={language.text} language={language.language} recap={orderRecap} deliveryDate={deliveryDate} deliveryAddress={auth.session.user.restaurant?.address ?? ''} isSubmittingOrder={isSubmittingOrder} submitError={orderSubmitError} latestCreatedOrder={latestCreatedOrder} onDeliveryDateChange={setDeliveryDate} onSubmitOrder={() => {
                    void handleSubmitOrder();
                }} onDownloadOrderBon={(order) => {
                    void handleDownloadOrderBon(order);
                }} onBack={() => goToMenuPage('orders', true)}/>);
        }
        if (page === 'orderHistory') {
            if (canAccessOrders) {
                return (<OrderHistoryPage_1.OrderHistoryPage text={language.text} accessToken={auth.session.accessToken} orders={orderHistory} isLoading={isLoadingOrderHistory} deletingOrderId={deletingOrderId} onRefresh={() => {
                        void loadOrderHistory();
                    }} onDownloadOrderBon={(order) => {
                        void handleDownloadOrderBon(order);
                    }} onDeleteOrder={(order) => {
                        void handleDeleteOrder(order);
                    }}/>);
            }
            return null;
        }
        if (page === 'supplierManagement') {
            if (auth.session.user.role === 'ADMIN') {
                return (<SupplierManagementPage_1.SupplierManagementPage text={language.text} accessToken={auth.session.accessToken}/>);
            }
            return null;
        }
        return (<SessionCard_1.SessionCard user={auth.session.user} accessToken={auth.session.accessToken} text={language.text}/>);
    }
    return (<react_native_1.View style={App_styles_1.styles.page}>
      <expo_status_bar_1.StatusBar style="dark"/>
      <react_native_1.SafeAreaView style={App_styles_1.styles.safeArea}>
        <react_native_1.View style={App_styles_1.styles.appFrame}>
          {auth.session && !isLoginTransitionLoading ? (<HeaderDrawer_1.HeaderDrawer isOpen={isDrawerOpen} text={language.text} language={language.language} currentUser={auth.session.user} activePage={activePage} onToggle={() => setIsDrawerOpen((isOpen) => !isOpen)} onClose={() => setIsDrawerOpen(false)} onSelectPage={(page) => goToMenuPage(page)} onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
            }} onLogout={() => {
                void auth.logout();
            }}/>) : null}

          {!auth.session ? (renderPublicContent()) : isLoginTransitionLoading || shouldShowPostLoginLoader ? (<react_native_1.Animated.View style={[
                App_styles_1.styles.loginLoaderFullscreen,
                { opacity: loginLoaderOpacity },
            ]}>
              <react_native_1.Animated.View style={[
                App_styles_1.styles.loginLoaderCard,
                {
                    transform: [{ scale: loginLoaderScale }],
                },
            ]}>
                <LoginSvgLoader_1.LoginSvgLoader />
              </react_native_1.Animated.View>
            </react_native_1.Animated.View>) : (<react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} style={App_styles_1.styles.keyboardAreaContent}>
              <react_native_1.ScrollView ref={scrollViewRef} contentContainerStyle={[
                App_styles_1.styles.content,
                auth.session && App_styles_1.styles.contentWithHeader,
            ]}>
                <react_native_1.Animated.View style={[
                App_styles_1.styles.pageTransitionLayer,
                {
                    opacity: pageTransition,
                    transform: [
                        {
                            translateY: pageTransition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                            }),
                        },
                    ],
                },
            ]}>
                  {renderAuthenticatedContent(displayPage)}
                </react_native_1.Animated.View>
              </react_native_1.ScrollView>
            </react_native_1.KeyboardAvoidingView>)}
        </react_native_1.View>
      </react_native_1.SafeAreaView>
    </react_native_1.View>);
}
//# sourceMappingURL=App.js.map