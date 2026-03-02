import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
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
import { TrainingPage } from './src/components/TrainingPage';
import { useAuth } from './src/hooks/useAuth';
import { useLanguage } from './src/hooks/useLanguage';
import { usePreAuthRouter } from './src/hooks/usePreAuthRouter';
import {
  buildOrderBonUrl,
  createOrder,
  deleteOrder,
  fetchOrders,
  type OrderSummary,
} from './src/services/ordersApi';
import { onUnauthorized, throwIfUnauthorized } from './src/services/authSession';
import { requestResetPassword } from './src/services/authApi';
import { styles } from './src/styles/App.styles';
import type { MenuPage } from './src/types/menu';
import type { OrderRecapData } from './src/types/order';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DISABLE_POST_LOGIN_REDIRECT = false;

export default function App() {
  const auth = useAuth();
  const language = useLanguage();
  const preAuthRouter = usePreAuthRouter();
  const preAuthRoute = preAuthRouter.route;
  const goToPreAuthLanding = preAuthRouter.goToLanding;
  const goToPreAuthAuth = preAuthRouter.goToAuth;
  const preAuthResetToken = preAuthRouter.resetToken;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState<MenuPage>('dashboard');
  const [displayPage, setDisplayPage] = useState<MenuPage>('dashboard');
  const [isLoginTransitionLoading, setIsLoginTransitionLoading] = useState(false);
  const [orderRecap, setOrderRecap] = useState<OrderRecapData | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<number, number>>({});
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateString());
  const [orderHistory, setOrderHistory] = useState<OrderSummary[]>([]);
  const [isLoadingOrderHistory, setIsLoadingOrderHistory] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState<{
    id: number;
    number: string;
    bonUrl: string;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const pageTransition = useRef(new Animated.Value(1)).current;
  const loginLoaderOpacity = useRef(new Animated.Value(0)).current;
  const loginLoaderScale = useRef(new Animated.Value(0.86)).current;
  const loginLoaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordNotice, setResetPasswordNotice] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const styleId = 'webapp-auth-input-overrides';
    if (document.getElementById(styleId)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      input,
      textarea {
        outline: none !important;
        box-shadow: none !important;
      }

      input {
        box-sizing: border-box !important;
        height: 100% !important;
        line-height: normal !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      input:focus,
      textarea:focus {
        outline: none !important;
        box-shadow: none !important;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: #ab1e24 !important;
        caret-color: #ab1e24 !important;
        -webkit-box-shadow: 0 0 0px 1000px white inset !important;
        box-shadow: 0 0 0px 1000px white inset !important;
        padding-right: 10px !important;
        transition: background-color 9999s ease-in-out 0s;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
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
      void auth.logout();
    });

    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    return () => {
      if (loginLoaderTimeoutRef.current) {
        clearTimeout(loginLoaderTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (preAuthRoute !== 'resetPassword') {
      setResetPassword('');
      setResetPasswordError(null);
      setResetPasswordNotice(null);
      setIsSubmittingResetPassword(false);
    }
  }, [preAuthRoute]);

  useEffect(() => {
    if (!auth.session) {
      setIsDrawerOpen(false);
      goToPreAuthLanding(true);
      setActivePage('dashboard');
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

    if (
      (
        activePage === 'orders' ||
        activePage === 'orderRecap' ||
        activePage === 'orderHistory'
      ) &&
      auth.session.user.role !== 'ADMIN' &&
      auth.session.user.role !== 'MANAGER'
    ) {
      setActivePage('dashboard');
      setOrderRecap(null);
    }

    if (activePage === 'supplierManagement' && auth.session.user.role !== 'ADMIN') {
      setActivePage('dashboard');
    }
  }, [activePage, auth.session, goToPreAuthLanding]);

  useEffect(() => {
    if (!auth.session || preAuthRoute !== 'auth') {
      return;
    }

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
          setIsLoginTransitionLoading(false);
        }
      });
    }, 2000);
  }, [
    auth.session,
    loginLoaderOpacity,
    loginLoaderScale,
    preAuthRoute,
  ]);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    if (activePage === displayPage) {
      return;
    }

    pageTransition.stopAnimation();

    Animated.timing(pageTransition, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayPage(activePage);
      pageTransition.setValue(0);

      Animated.timing(pageTransition, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [activePage, auth.session, displayPage, pageTransition]);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    if (auth.session.user.role !== 'ADMIN' && auth.session.user.role !== 'MANAGER') {
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

  async function handleDownloadOrderBon(order: { id: number; bonUrl: string; number?: string }) {
    const url = order.bonUrl || buildOrderBonUrl(order.id);

    if (Platform.OS === 'web') {
      try {
        const token = auth.session?.accessToken;
        const response = await fetch(url, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (!response.ok) {
          throwIfUnauthorized(response);
          throw new Error('ORDER_BON_DOWNLOAD_FAILED');
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const fileName = `${order.number ?? `order-${order.id}`}.pdf`;
        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        window.document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(objectUrl);
      } catch {
        if (typeof window !== 'undefined') {
          window.open(url, '_blank');
        }
      }

      return;
    }

    void Linking.openURL(url);
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

  function handleProceedToOrderRecap(recap: OrderRecapData) {
    setOrderRecap(recap);
    setLatestCreatedOrder(null);
    setActivePage('orderRecap');
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
        onQuantitiesChange={setOrderQuantities}
        onSubmitOrder={handleProceedToOrderRecap}
      />
    );
  }

  function renderPublicContent() {
    if (preAuthRoute === 'landing') {
      return <PreLoginHome text={language.text} onStart={() => goToPreAuthAuth()} />;
    }

    if (preAuthRoute === 'resetPassword') {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAreaContent}
        >
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
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
                    setResetPasswordNotice(language.text.auth.resetPasswordSuccess);
                    setTimeout(() => {
                      goToPreAuthAuth();
                    }, 900);
                  })
                  .catch((error: unknown) => {
                    if (
                      error instanceof Error &&
                      error.message.includes('INVALID_OR_EXPIRED_RESET_TOKEN')
                    ) {
                      setResetPasswordError(language.text.auth.resetTokenInvalidOrExpired);
                      return;
                    }

                    if (error instanceof Error && error.message.includes('PASSWORD_TOO_SHORT')) {
                      setResetPasswordError(language.text.auth.passwordTooShort);
                      return;
                    }

                    setResetPasswordError(language.text.auth.resetPasswordFailed);
                  })
                  .finally(() => {
                    setIsSubmittingResetPassword(false);
                  });
              }}
              onBackToLogin={() => goToPreAuthAuth()}
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
            onSubmit={() => void auth.submitAuth(auth.mode, language.text, language.language)}
            onForgotPassword={() => void auth.forgotPassword(language.text, language.language)}
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
      auth.session.user.role === 'ADMIN' || auth.session.user.role === 'MANAGER';

    if (page === 'training') {
      return (
        <TrainingPage
          text={language.text}
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
      return <RestaurantFormsPage text={language.text} />;
    }

    if (page === 'orders') {
      return canAccessOrders ? renderOrderBuilder() : null;
    }

    if (page === 'orderRecap') {
      if (!orderRecap) {
        return renderOrderBuilder();
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
          onBack={() => setActivePage('orders')}
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
        onLogout={() => void auth.logout()}
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
              onSelectPage={setActivePage}
              onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
              }}
            />
          ) : null}

          {!auth.session ? (
            renderPublicContent()
          ) : isLoginTransitionLoading ? (
            <Animated.View style={[styles.loginLoaderFullscreen, { opacity: loginLoaderOpacity }]}>
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
                <Animated.View
                  style={[
                    styles.pageTransitionLayer,
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
                  ]}
                >
                  {renderAuthenticatedContent(displayPage)}
                </Animated.View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
