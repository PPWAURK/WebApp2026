import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AuthForm } from './src/components/AuthForm';
import { HeaderDrawer } from './src/components/HeaderDrawer';
import { OrderHistoryPage } from './src/components/OrderHistoryPage';
import { OrderRecapPage } from './src/components/OrderRecapPage';
import { OrdersPage } from './src/components/OrdersPage';
import { ProfilePage } from './src/components/ProfilePage';
import { RestaurantFormsPage } from './src/components/RestaurantFormsPage';
import { SessionCard } from './src/components/SessionCard';
import { SupplierManagementPage } from './src/components/SupplierManagementPage';
import { TrainingPage } from './src/components/TrainingPage';
import { useAuth } from './src/hooks/useAuth';
import { useLanguage } from './src/hooks/useLanguage';
import {
  buildOrderBonUrl,
  createOrder,
  deleteOrder,
  fetchOrders,
  type OrderSummary,
} from './src/services/ordersApi';
import { styles } from './src/styles/appStyles';
import type { MenuPage } from './src/types/menu';
import type { OrderRecapData } from './src/types/order';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const auth = useAuth();
  const language = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState<MenuPage>('dashboard');
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

  function scrollToBottom() {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }

  function scrollToTop() {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }

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
    if (!auth.session) {
      setIsDrawerOpen(false);
      setActivePage('dashboard');
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
        activePage === 'supplierManagement' ||
        activePage === 'orderRecap' ||
        activePage === 'orderHistory'
      ) &&
      auth.session.user.role !== 'ADMIN' &&
      auth.session.user.role !== 'MANAGER'
    ) {
      setActivePage('dashboard');
      setOrderRecap(null);
    }
  }, [activePage, auth.session]);

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

  if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  function renderAuthenticatedContent() {
    if (!auth.session) {
      return null;
    }

    if (activePage === 'training') {
      return (
        <TrainingPage
          text={language.text}
          accessToken={auth.session.accessToken}
          currentUser={auth.session.user}
        />
      );
    }

    if (activePage === 'profile') {
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

    if (activePage === 'restaurantForms') {
      return <RestaurantFormsPage text={language.text} />;
    }

    if (activePage === 'orders') {
      if (auth.session.user.role === 'ADMIN' || auth.session.user.role === 'MANAGER') {
        return (
          <OrdersPage
            text={language.text}
            accessToken={auth.session.accessToken}
            language={language.language}
            quantities={orderQuantities}
            onQuantitiesChange={setOrderQuantities}
            onSubmitOrder={(recap) => {
              setOrderRecap(recap);
              setLatestCreatedOrder(null);
              setActivePage('orderRecap');
            }}
          />
        );
      }

      return null;
    }

    if (activePage === 'orderRecap') {
      if (!orderRecap) {
        return (
          <OrdersPage
            text={language.text}
            accessToken={auth.session.accessToken}
            language={language.language}
            quantities={orderQuantities}
            onQuantitiesChange={setOrderQuantities}
            onSubmitOrder={(recap) => {
              setOrderRecap(recap);
              setLatestCreatedOrder(null);
              setActivePage('orderRecap');
            }}
          />
        );
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

    if (activePage === 'orderHistory') {
      if (auth.session.user.role === 'ADMIN' || auth.session.user.role === 'MANAGER') {
        return (
          <OrderHistoryPage
            text={language.text}
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

    if (activePage === 'supplierManagement') {
      if (auth.session.user.role === 'ADMIN' || auth.session.user.role === 'MANAGER') {
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
          {auth.session ? (
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
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{language.text.appBadge}</Text>
            </View>

            {!auth.session ? (
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
                onSubmit={() => void auth.submitAuth(auth.mode, language.text)}
                onToggleMode={auth.toggleMode}
              />
            ) : (
              renderAuthenticatedContent()
            )}
            </ScrollView>
          </KeyboardAvoidingView>

          {auth.session && activePage === 'orders' ? (
            <View style={styles.floatingScrollStack} pointerEvents="box-none">
              <Pressable style={styles.floatingScrollButton} onPress={scrollToTop}>
                <Text style={styles.floatingScrollButtonText}>↑</Text>
              </Pressable>
              <Pressable style={styles.floatingScrollButton} onPress={scrollToBottom}>
                <Text style={styles.floatingScrollButtonText}>↓</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
