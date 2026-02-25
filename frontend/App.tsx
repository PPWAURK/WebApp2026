import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { RestaurantFormsPage } from './src/components/RestaurantFormsPage';
import { SessionCard } from './src/components/SessionCard';
import { SupplierManagementPage } from './src/components/SupplierManagementPage';
import { TrainingPage } from './src/components/TrainingPage';
import { useAuth } from './src/hooks/useAuth';
import { useLanguage } from './src/hooks/useLanguage';
import { buildOrderBonUrl, createOrder, fetchOrders, type OrderSummary } from './src/services/ordersApi';
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
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
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

    try {
      const created = await createOrder(auth.session.accessToken, {
        deliveryDate,
        items: orderRecap.items,
      });

      setLatestCreatedOrder(created);
      await loadOrderHistory();
    } catch {
      // keep page state; user can retry
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
            onRefresh={() => {
              void loadOrderHistory();
            }}
            onDownloadOrderBon={(order) => {
              void handleDownloadOrderBon(order);
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
