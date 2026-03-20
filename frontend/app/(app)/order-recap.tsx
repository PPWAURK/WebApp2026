import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { OrderRecapPage } from '../../src/components/OrderRecapPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderBonDownloader } from '../../src/hooks/useOrderBonDownloader';
import { useOrderFlow } from '../../src/hooks/useOrderFlow';
import { createOrder } from '../../src/services/ordersApi';
import type { Role } from '../../src/types/auth';

function canAccessOrders(role: Role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export default function OrderRecapScreen() {
  const auth = useAuth();
  const language = useLanguage();
  const router = useRouter();
  const downloadOrderBon = useOrderBonDownloader(auth.session?.accessToken);
  const {
    orderRecap,
    deliveryDate,
    setDeliveryDate,
    latestCreatedOrder,
    setLatestCreatedOrder,
    resetOrderDraft,
  } = useOrderFlow();
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!auth.session) {
    return null;
  }

  if (!canAccessOrders(auth.session.user.role)) {
    return <Redirect href="/dashboard" />;
  }

  if (!orderRecap) {
    return <Redirect href="/orders" />;
  }

  const session = auth.session;
  const recap = orderRecap;

  async function handleSubmitOrder() {
    setIsSubmittingOrder(true);
    setSubmitError(null);

    try {
      const created = await createOrder(session.accessToken, {
        deliveryDate,
        items: recap.items,
      });

      setLatestCreatedOrder(created);
      void downloadOrderBon(created);
      resetOrderDraft();
      router.replace('/order-history');
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setSubmitError(error.message);
      } else {
        setSubmitError(language.text.orders.submitOrderError);
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <OrderRecapPage
      text={language.text}
      language={language.language}
      recap={recap}
      deliveryDate={deliveryDate}
      deliveryAddress={session.user.restaurant?.address ?? ''}
      isSubmittingOrder={isSubmittingOrder}
      submitError={submitError}
      latestCreatedOrder={latestCreatedOrder}
      onDeliveryDateChange={setDeliveryDate}
      onSubmitOrder={() => {
        void handleSubmitOrder();
      }}
      onDownloadOrderBon={(order) => {
        void downloadOrderBon(order);
      }}
      onBack={() => {
        router.replace('/orders');
      }}
    />
  );
}
