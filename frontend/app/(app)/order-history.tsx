import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { OrderHistoryPage } from '../../src/components/OrderHistoryPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderBonDownloader } from '../../src/hooks/useOrderBonDownloader';
import {
  deleteOrder,
  fetchOrders,
  type OrderSummary,
} from '../../src/services/ordersApi';
import type { Role } from '../../src/types/auth';

function canAccessOrders(role: Role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export default function OrderHistoryScreen() {
  const auth = useAuth();
  const language = useLanguage();
  const downloadOrderBon = useOrderBonDownloader(auth.session?.accessToken);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!auth.session || !canAccessOrders(auth.session.user.role)) {
      setOrders([]);
      setIsLoading(false);
      setDeletingOrderId(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void fetchOrders(auth.session.accessToken)
      .then((result) => {
        if (isActive) {
          setOrders(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setOrders([]);
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
  }, [auth.session]);

  if (!auth.session) {
    return null;
  }

  if (!canAccessOrders(auth.session.user.role)) {
    return <Redirect href="/dashboard" />;
  }

  const session = auth.session;

  async function loadOrderHistory() {
    setIsLoading(true);

    try {
      const result = await fetchOrders(session.accessToken);
      setOrders(result);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
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
    } finally {
      setDeletingOrderId(null);
    }
  }

  return (
    <OrderHistoryPage
      text={language.text}
      accessToken={session.accessToken}
      orders={orders}
      isLoading={isLoading}
      deletingOrderId={deletingOrderId}
      onRefresh={() => {
        void loadOrderHistory();
      }}
      onDownloadOrderBon={(order) => {
        void downloadOrderBon(order);
      }}
      onDeleteOrder={(order) => {
        void handleDeleteOrder(order);
      }}
    />
  );
}
