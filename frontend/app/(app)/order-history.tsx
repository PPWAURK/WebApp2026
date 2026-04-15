import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { OrderHistoryPage } from '../../src/components/OrderHistoryPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderBonDownloader } from '../../src/hooks/useOrderBonDownloader';
import { fetchRestaurants } from '../../src/services/restaurantsApi';
import {
  deleteOrder,
  fetchOrders,
  fetchOrderReturns,
  type OrderReturnSummary,
  type OrderSummary,
} from '../../src/services/ordersApi';
import type { Restaurant } from '../../src/types/auth';
import { canUserAccessOrders } from '../../src/utils/orderAccess';

function showFeedback(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
    return;
  }

  Alert.alert(title, message);
}

export default function OrderHistoryScreen() {
  const auth = useAuth();
  const language = useLanguage();
  const downloadOrderBon = useOrderBonDownloader(auth.session?.accessToken);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderReturns, setOrderReturns] = useState<OrderReturnSummary[]>([]);
  const [restaurantOptions, setRestaurantOptions] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  async function loadHistoryData(
    accessToken: string,
    restaurantId: number | null,
  ) {
    const [ordersResult, returnsResult] = await Promise.allSettled([
      fetchOrders(accessToken, { restaurantId: restaurantId ?? undefined }),
      fetchOrderReturns(accessToken, {
        restaurantId: restaurantId ?? undefined,
      }),
    ]);

    return {
      orders: ordersResult.status === 'fulfilled' ? ordersResult.value : [],
      orderReturns:
        returnsResult.status === 'fulfilled' ? returnsResult.value : [],
    };
  }

  const canSelectAllRestaurants =
    auth.session?.user.role === 'ADMIN' ||
    auth.session?.user.role === 'REGIONAL_MANAGER';

  const allRestaurantsLabel =
    auth.session?.user.role === 'REGIONAL_MANAGER'
      ? language.text.orders.allManagedRestaurantsOption
      : language.text.orders.allRestaurantsOption;

  const scopedRestaurantOptions = useMemo(() => {
    if (!auth.session) {
      return [];
    }

    if (auth.session.user.role === 'ADMIN') {
      return restaurantOptions;
    }

    if (auth.session.user.role === 'REGIONAL_MANAGER') {
      return auth.session.user.managedRestaurants;
    }

    return auth.session.user.restaurant ? [auth.session.user.restaurant] : [];
  }, [auth.session, restaurantOptions]);

  useEffect(() => {
    if (!auth.session || auth.session.user.role !== 'ADMIN') {
      setRestaurantOptions([]);
      return;
    }

    let isActive = true;

    void fetchRestaurants()
      .then((result) => {
        if (isActive) {
          setRestaurantOptions(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setRestaurantOptions([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [auth.session]);

  useEffect(() => {
    if (!auth.session) {
      setSelectedRestaurantId(null);
      return;
    }

    if (canSelectAllRestaurants) {
      setSelectedRestaurantId((currentValue) => {
        if (
          currentValue !== null &&
          scopedRestaurantOptions.some(
            (restaurant) => restaurant.id === currentValue,
          )
        ) {
          return currentValue;
        }

        return null;
      });
      return;
    }

    setSelectedRestaurantId(scopedRestaurantOptions[0]?.id ?? null);
  }, [auth.session, canSelectAllRestaurants, scopedRestaurantOptions]);

  useEffect(() => {
    if (!auth.session || !canUserAccessOrders(auth.session.user)) {
      setOrders([]);
      setOrderReturns([]);
      setIsLoading(false);
      setDeletingOrderId(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void loadHistoryData(auth.session.accessToken, selectedRestaurantId)
      .then((result) => {
        if (isActive) {
          setOrders(result.orders);
          setOrderReturns(result.orderReturns);
        }
      })
      .catch(() => {
        if (isActive) {
          setOrders([]);
          setOrderReturns([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [auth.session, selectedRestaurantId]);

  if (!auth.session) {
    return null;
  }

  if (!canUserAccessOrders(auth.session.user)) {
    return <Redirect href="/dashboard" />;
  }

  const session = auth.session;

  async function loadOrderHistory() {
    setIsLoading(true);

    try {
      const result = await loadHistoryData(
        session.accessToken,
        selectedRestaurantId,
      );
      setOrders(result.orders);
      setOrderReturns(result.orderReturns);
    } catch {
      setOrders([]);
      setOrderReturns([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteReturnSuccess(returnId: number) {
    setOrderReturns((currentReturns) =>
      currentReturns.filter((orderReturn) => orderReturn.id !== returnId),
    );
  }

  async function handleDeleteOrder(order: OrderSummary) {
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

    try {
      await deleteOrder(session.accessToken, order.id);
      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : language.text.orders.deleteHistoryError;
      showFeedback(language.text.orders.deleteHistoryButton, message);
    } finally {
      setDeletingOrderId(null);
    }
  }

  return (
    <OrderHistoryPage
      text={language.text}
      accessToken={session.accessToken}
      orders={orders}
      orderReturns={orderReturns}
      restaurantOptions={scopedRestaurantOptions}
      selectedRestaurantId={selectedRestaurantId}
      allRestaurantsLabel={allRestaurantsLabel}
      canSelectAllRestaurants={canSelectAllRestaurants}
      isLoading={isLoading}
      deletingOrderId={deletingOrderId}
      onSelectRestaurantId={setSelectedRestaurantId}
      onRefresh={loadOrderHistory}
      onDeleteReturnSuccess={handleDeleteReturnSuccess}
      onDownloadOrderBon={(order) => {
        void downloadOrderBon(order);
      }}
      onDeleteOrder={(order) => {
        void handleDeleteOrder(order);
      }}
    />
  );
}
