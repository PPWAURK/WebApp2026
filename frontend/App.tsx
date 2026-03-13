import {
  Manrope_400Regular,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { AuthForm } from './src/components/AuthForm';
import { HeaderDrawer } from './src/components/HeaderDrawer';
import { LoginSvgLoader } from './src/components/LoginSvgLoader';
import { OrderHistoryPage } from './src/components/OrderHistoryPage';
import { OrderRecapPage } from './src/components/OrderRecapPage';
import { OrdersPage } from './src/components/OrdersPage';
import { PreLoginHome } from './src/components/PreLoginHome';
import { ProfilePage } from './src/components/ProfilePage';
import { ResetPasswordForm } from './src/components/ResetPasswordForm';
import { RestaurantFormsPage } from './src/components/RestaurantFormsPage';
import { SessionCard } from './src/components/SessionCard';
import { SupplierManagementPage } from './src/components/SupplierManagementPage';
import { TrainingPage, TrainingPageLegacy } from './src/components/TrainingPage';
import { useAuth } from './src/hooks/useAuth';
import { useLanguage } from './src/hooks/useLanguage';
import { useOrderFlow } from './src/hooks/useOrderFlow';
import { TRAINING_FEATURE_FLAGS } from './src/constants/featureFlags';
import {
  buildOrderBonUrl,
  createOrder,
  deleteOrder,
  fetchOrders,
  type OrderSummary,
} from './src/services/ordersApi';
import {
  onUnauthorized,
  throwIfUnauthorized,
} from './src/services/authSession';
import { requestResetPassword } from './src/services/authApi';
import { styles } from './src/styles/App.styles';
import type { MenuPage } from './src/types/menu';
import type { OrderRecapData } from './src/types/order';

type PreAuthRoute = 'landing' | 'auth' | 'resetPassword';

function normalizePathname(pathname: string): string {
  const lower = pathname.toLowerCase();
  const withLeadingSlash = lower.startsWith('/') ? lower : `/${lower}`;
  if (withLeadingSlash.length <= 1) {
    return '/';
  }

  return withLeadingSlash.replace(/\/+$/, '');
}

function pathToPreAuthRoute(pathname: string): PreAuthRoute {
  const normalized = normalizePathname(pathname);

  if (
    normalized === '/auth' ||
    normalized === '/login' ||
    normalized === '/signin'
  ) {
    return 'auth';
  }

  if (
    normalized === '/reset-password' ||
    normalized === '/resetpassword' ||
    normalized === '/password-reset'
  ) {
    return 'resetPassword';
  }

  return 'landing';
}

function pathToMenuPage(pathname: string): MenuPage | null {
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

function menuPageToPath(page: MenuPage): string {
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

function normalizeTokenParam(
  value: string | string[] | undefined,
): string | null {
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

export default function App() {
  const auth = useAuth();
  const language = useLanguage();
  const {
    orderRecap,
    setOrderRecap,
    orderQuantities,
    setOrderQuantities,
    selectedOrderSupplierId,
    setSelectedOrderSupplierId,
    selectedOrderCategory,
    setSelectedOrderCategory,
    orderProductSearch,
    setOrderProductSearch,
    deliveryDate,
    setDeliveryDate,
    latestCreatedOrder,
    setLatestCreatedOrder,
    resetOrderDraft,
  } = useOrderFlow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const normalizedPathname = normalizePathname(pathname);
  const preAuthRoute = pathToPreAuthRoute(pathname);
  const preAuthResetToken = normalizeTokenParam(params.token);
  const activePage = pathToMenuPage(pathname) ?? 'dashboard';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginTransitionLoading, setIsLoginTransitionLoading] =
    useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderSummary[]>([]);
  const [isLoadingOrderHistory, setIsLoadingOrderHistory] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const loginLoaderOpacity = useRef(new Animated.Value(0)).current;
  const loginLoaderScale = useRef(new Animated.Value(0.86)).current;
  const loginLoaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const postLoginAnimationTokenRef = useRef<string | null>(null);
  const isPostLoginAnimatingRef = useRef(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] =
    useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null,
  );
  const [resetPasswordNotice, setResetPasswordNotice] = useState<string | null>(
    null,
  );

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

  function goToMenuPage(page: MenuPage, replace = false) {
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const isAuthRoute =
      preAuthRoute === 'auth' || preAuthRoute === 'resetPassword';

    if (isAuthRoute) {
      root.setAttribute('data-auth-route', 'true');
    } else {
      root.removeAttribute('data-auth-route');
    }

    return () => {
      root.removeAttribute('data-auth-route');
    };
  }, [preAuthRoute]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const lockDurationMs = 450;
    const lastClickAt = new WeakMap<Element, number>();

    function handleWebClickCapture(event: MouseEvent) {
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

      if (
        typeof previousClick === 'number' &&
        now - previousClick < lockDurationMs
      ) {
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
      const result = await fetchOrders(auth.session.accessToken);
      setOrderHistory(result);
    } catch {
      setOrderHistory([]);
    } finally {
      setIsLoadingOrderHistory(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void auth.logout(language.text.auth.sessionExpired);
    });

    return unsubscribe;
  }, [auth, language.text.auth.sessionExpired]);

  useEffect(() => {
    return () => {
      if (loginLoaderTimeoutRef.current) {
        clearTimeout(loginLoaderTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
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

    if (
      normalizedHashPath === '/auth' ||
      normalizedHashPath === '/login' ||
      normalizedHashPath === '/signin'
    ) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
      router.replace('/login');
      return;
    }

    if (
      normalizedHashPath === '/reset-password' ||
      normalizedHashPath === '/resetpassword' ||
      normalizedHashPath === '/password-reset'
    ) {
      const hashToken =
        new URLSearchParams(rawQuery || '').get('token') ?? undefined;
      const normalizedHashToken = normalizeTokenParam(hashToken);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
      if (normalizedHashToken) {
        router.replace(
          `/reset-password?token=${encodeURIComponent(normalizedHashToken)}`,
        );
        return;
      }

      router.replace('/reset-password');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (preAuthRoute !== 'resetPassword') {
      setResetPassword('');
      setResetPasswordError(null);
      setResetPasswordNotice(null);
      setIsSubmittingResetPassword(false);
    }
  }, [preAuthRoute]);

  useEffect(() => {
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
      setIsLoginTransitionLoading(false);
      loginLoaderOpacity.setValue(0);
      loginLoaderScale.setValue(0.86);
      resetOrderDraft();
      setOrderHistory([]);
      setIsLoadingOrderHistory(false);
      setDeletingOrderId(null);
      setOrderSubmitError(null);
      setIsUploadingProfilePhoto(false);
      setProfileError(null);
      return;
    }

    if (
      (activePage === 'orders' ||
        activePage === 'orderRecap' ||
        activePage === 'orderHistory') &&
      auth.session.user.role !== 'ADMIN' &&
      auth.session.user.role !== 'MANAGER'
    ) {
      goToMenuPage('dashboard', true);
      resetOrderDraft();
    }

    if (
      activePage === 'supplierManagement' &&
      auth.session.user.role !== 'ADMIN'
    ) {
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

  useEffect(() => {
    if (auth.isLoadingSession || !auth.session) {
      return;
    }

    if (normalizedPathname === '/') {
      goToMenuPage('dashboard', true);
    }
  }, [auth.isLoadingSession, auth.session, normalizedPathname]);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    // Post-login loader is handled by the dedicated /login route. Avoid
    // hijacking internal authenticated navigation from this legacy effect.
    if (preAuthRoute !== 'auth' || !auth.postLoginAnimationPending) {
      return;
    }

    if (normalizedPathname !== '/login' && normalizedPathname !== '/auth') {
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

    Animated.parallel([
      Animated.timing(loginLoaderOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(loginLoaderScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    if (DISABLE_POST_LOGIN_REDIRECT) {
      return;
    }

    loginLoaderTimeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(loginLoaderOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(loginLoaderScale, {
          toValue: 1.04,
          duration: 360,
          easing: Easing.inOut(Easing.cubic),
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
  }, [
    auth.postLoginAnimationPending,
    auth.session,
    loginLoaderOpacity,
    loginLoaderScale,
    normalizedPathname,
    preAuthRoute,
  ]);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    if (
      auth.session.user.role !== 'ADMIN' &&
      auth.session.user.role !== 'MANAGER'
    ) {
      return;
    }

    let isActive = true;

    void fetchOrders(auth.session.accessToken)
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

  useEffect(() => {
    if (!auth.session || activePage !== 'orderHistory') {
      return;
    }

    void loadOrderHistory();
  }, [activePage, auth.session]);

  useEffect(() => {
    if (!auth.session || activePage !== 'orderRecap' || orderRecap) {
      return;
    }

    goToMenuPage('orders', true);
  }, [activePage, auth.session, orderRecap]);

  async function handleSubmitOrder() {
    if (!auth.session || !orderRecap) {
      return;
    }

    setIsSubmittingOrder(true);
    setOrderSubmitError(null);

    try {
      const created = await createOrder(auth.session.accessToken, {
        deliveryDate,
        items: orderRecap.items,
      });

      setLatestCreatedOrder(created);
      void handleDownloadOrderBon(created);
      await loadOrderHistory();
      resetOrderDraft();
      goToMenuPage('orderHistory', true);
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setOrderSubmitError(error.message);
      } else {
        setOrderSubmitError(language.text.orders.submitOrderError);
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  async function handleDownloadOrderBon(order: {
    id: number;
    bonUrl: string;
    number?: string;
  }) {
    const url = buildOrderBonUrl(order.id);
    const token = auth.session?.accessToken;
    const fileName = `${order.number ?? `order-${order.id}`}.pdf`;

    if (!token) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(language.text.orders.downloadBonError);
      } else {
        Alert.alert(
          language.text.orders.downloadBonButton,
          language.text.orders.downloadBonError,
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throwIfUnauthorized(response);
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
      } catch {
        if (
          typeof window !== 'undefined' &&
          typeof window.alert === 'function'
        ) {
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

      await Linking.openURL(downloadResult.uri);
    } catch {
      Alert.alert(
        language.text.orders.downloadBonButton,
        language.text.orders.downloadBonError,
      );
    }
  }

  async function handleDeleteOrder(order: OrderSummary) {
    if (!auth.session) {
      return;
    }

    const confirmationMessage = language.text.orders.deleteHistoryConfirm;
    const confirmed =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.confirm(confirmationMessage)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              language.text.orders.deleteHistoryButton,
              confirmationMessage,
              [
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
              ],
              { cancelable: true, onDismiss: () => resolve(false) },
            );
          });

    if (!confirmed) {
      return;
    }

    setDeletingOrderId(order.id);
    setOrderSubmitError(null);

    try {
      await deleteOrder(auth.session.accessToken, order.id);
      setOrderHistory((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setOrderSubmitError(error.message);
      } else {
        setOrderSubmitError(language.text.orders.deleteHistoryError);
      }
    } finally {
      setDeletingOrderId(null);
    }
  }

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  const shouldShowPostLoginLoader =
    isLoginTransitionLoading && !DISABLE_POST_LOGIN_REDIRECT;

  function handleProceedToOrderRecap(recap: OrderRecapData) {
    setOrderRecap(recap);
    setLatestCreatedOrder(null);
    setOrderSubmitError(null);
    goToMenuPage('orderRecap');
  }

  function renderOrderBuilder() {
    if (!auth.session) {
      return null;
    }

    return (
      <OrdersPage
        text={language.text}
        accessToken={auth.session.accessToken}
        language={language.language}
        quantities={orderQuantities}
        selectedSupplierId={selectedOrderSupplierId}
        selectedCategory={selectedOrderCategory}
        productSearch={orderProductSearch}
        onQuantitiesChange={setOrderQuantities}
        onSelectedSupplierIdChange={setSelectedOrderSupplierId}
        onSelectedCategoryChange={setSelectedOrderCategory}
        onProductSearchChange={setOrderProductSearch}
        onSubmitOrder={handleProceedToOrderRecap}
      />
    );
  }

  function renderPublicContent() {
    if (preAuthRoute === 'landing') {
      return (
        <PreLoginHome text={language.text} onStart={() => goToPreAuthAuth()} />
      );
    }

    if (preAuthRoute === 'resetPassword') {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAreaContent}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.content}
          >
            <ResetPasswordForm
              text={language.text}
              password={resetPassword}
              isSubmitting={isSubmittingResetPassword}
              error={resetPasswordError}
              notice={resetPasswordNotice}
              hasToken={Boolean(preAuthResetToken)}
              onPasswordChange={setResetPassword}
              onSubmit={() => {
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

                void requestResetPassword(preAuthResetToken, resetPassword)
                  .then(() => {
                    setResetPassword('');
                    setResetPasswordNotice(
                      language.text.auth.resetPasswordSuccess,
                    );
                    setTimeout(() => {
                      goToPreAuthAuth(true);
                    }, 900);
                  })
                  .catch((error: unknown) => {
                    if (
                      error instanceof Error &&
                      error.message.includes('INVALID_OR_EXPIRED_RESET_TOKEN')
                    ) {
                      setResetPasswordError(
                        language.text.auth.resetTokenInvalidOrExpired,
                      );
                      return;
                    }

                    if (
                      error instanceof Error &&
                      error.message.includes('PASSWORD_TOO_SHORT')
                    ) {
                      setResetPasswordError(
                        language.text.auth.passwordTooShort,
                      );
                      return;
                    }

                    setResetPasswordError(
                      language.text.auth.resetPasswordFailed,
                    );
                  })
                  .finally(() => {
                    setIsSubmittingResetPassword(false);
                  });
              }}
              onBackToLogin={() => goToPreAuthAuth(true)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAreaContent}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
          <AuthForm
            mode={auth.mode}
            title={
              auth.mode === 'login'
                ? language.text.auth.loginTitle
                : language.text.auth.registerTitle
            }
            text={language.text}
            language={language.language}
            email={auth.email}
            password={auth.password}
            name={auth.name}
            restaurants={auth.restaurants}
            selectedRestaurantId={auth.selectedRestaurantId}
            rememberMe={auth.rememberMe}
            isSubmitting={auth.isSubmitting}
            forgotPasswordCooldownSeconds={auth.forgotPasswordCooldownSeconds}
            error={auth.error}
            notice={auth.notice}
            onEmailChange={auth.setEmail}
            onPasswordChange={auth.setPassword}
            onNameChange={auth.setName}
            onSelectRestaurant={auth.setSelectedRestaurantId}
            onRememberToggle={() =>
              auth.setRememberMe((currentValue) => !currentValue)
            }
            onSelectLanguage={(nextLanguage) => {
              void language.setLanguage(nextLanguage);
            }}
            onSubmit={() =>
              void auth.submitAuth(auth.mode, language.text, language.language)
            }
            onForgotPassword={() =>
              void auth.forgotPassword(language.text, language.language)
            }
            onToggleMode={auth.toggleMode}
            onBackToLanding={() => goToPreAuthLanding()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  function renderAuthenticatedContent(page: MenuPage) {
    if (!auth.session) {
      return null;
    }

    const canAccessOrders =
      auth.session.user.role === 'ADMIN' ||
      auth.session.user.role === 'MANAGER';

    if (page === 'training') {
      const TrainingPageComponent = TRAINING_FEATURE_FLAGS.ENABLE_TRAINING_V2
        ? TrainingPage
        : TrainingPageLegacy;

      return (
        <TrainingPageComponent
          text={language.text}
          language={language.language}
          accessToken={auth.session.accessToken}
          currentUser={auth.session.user}
        />
      );
    }

    if (page === 'profile') {
      return (
        <ProfilePage
          text={language.text}
          user={auth.session.user}
          accessToken={auth.session.accessToken}
          isUploadingPhoto={isUploadingProfilePhoto}
          error={profileError}
          onUploadStart={() => {
            setProfileError(null);
            setIsUploadingProfilePhoto(true);
          }}
          onUploadFinish={() => {
            setIsUploadingProfilePhoto(false);
          }}
          onUploadError={setProfileError}
          onUserUpdate={(nextUser) => {
            void auth.updateSessionUser(nextUser);
          }}
        />
      );
    }

    if (page === 'restaurantForms') {
      return (
        <RestaurantFormsPage
          text={language.text}
          accessToken={auth.session.accessToken}
          currentUser={auth.session.user}
        />
      );
    }

    if (page === 'orders') {
      return canAccessOrders ? renderOrderBuilder() : null;
    }

    if (page === 'orderRecap') {
      if (!orderRecap) {
        return null;
      }

      return (
        <OrderRecapPage
          text={language.text}
          language={language.language}
          recap={orderRecap}
          deliveryDate={deliveryDate}
          deliveryAddress={auth.session.user.restaurant?.address ?? ''}
          isSubmittingOrder={isSubmittingOrder}
          submitError={orderSubmitError}
          latestCreatedOrder={latestCreatedOrder}
          onDeliveryDateChange={setDeliveryDate}
          onSubmitOrder={() => {
            void handleSubmitOrder();
          }}
          onDownloadOrderBon={(order) => {
            void handleDownloadOrderBon(order);
          }}
          onBack={() => goToMenuPage('orders', true)}
        />
      );
    }

    if (page === 'orderHistory') {
      if (canAccessOrders) {
        return (
          <OrderHistoryPage
            text={language.text}
            accessToken={auth.session.accessToken}
            orders={orderHistory}
            isLoading={isLoadingOrderHistory}
            deletingOrderId={deletingOrderId}
            onRefresh={() => {
              void loadOrderHistory();
            }}
            onDownloadOrderBon={(order) => {
              void handleDownloadOrderBon(order);
            }}
            onDeleteOrder={(order) => {
              void handleDeleteOrder(order);
            }}
          />
        );
      }

      return null;
    }

    if (page === 'supplierManagement') {
      if (auth.session.user.role === 'ADMIN') {
        return (
          <SupplierManagementPage
            text={language.text}
            accessToken={auth.session.accessToken}
          />
        );
      }

      return null;
    }

    return (
      <SessionCard
        user={auth.session.user}
        accessToken={auth.session.accessToken}
        text={language.text}
      />
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appFrame}>
          {auth.session && !isLoginTransitionLoading ? (
            <HeaderDrawer
              isOpen={isDrawerOpen}
              text={language.text}
              language={language.language}
              currentUser={auth.session.user}
              activePage={activePage}
              onToggle={() => setIsDrawerOpen((isOpen) => !isOpen)}
              onClose={() => setIsDrawerOpen(false)}
              onSelectPage={(page) => goToMenuPage(page)}
              onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
              }}
              onLogout={() => {
                void auth.logout();
              }}
            />
          ) : null}

          {!auth.session ? (
            renderPublicContent()
          ) : isLoginTransitionLoading || shouldShowPostLoginLoader ? (
            <Animated.View
              style={[
                styles.loginLoaderFullscreen,
                { opacity: loginLoaderOpacity },
              ]}
            >
              <Animated.View
                style={[
                  styles.loginLoaderCard,
                  {
                    transform: [{ scale: loginLoaderScale }],
                  },
                ]}
              >
                <LoginSvgLoader />
              </Animated.View>
            </Animated.View>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAreaContent}
            >
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={[
                  styles.content,
                  auth.session && styles.contentWithHeader,
                ]}
              >
                <View style={styles.pageTransitionLayer}>
                  {renderAuthenticatedContent(activePage)}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
