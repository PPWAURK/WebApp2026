import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { OrderRecapPage } from '../../src/components/OrderRecapPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderBonDownloader } from '../../src/hooks/useOrderBonDownloader';
import { useOrderFlow } from '../../src/hooks/useOrderFlow';
import { createOrder } from '../../src/services/ordersApi';
import { canUserAccessOrders } from '../../src/utils/orderAccess';

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
  } = useOrderFlow();
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSharePromptVisible, setIsSharePromptVisible] = useState(false);

  if (!auth.session) {
    return null;
  }

  if (!canUserAccessOrders(auth.session.user)) {
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
      setIsSharePromptVisible(true);
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
      sharePromptVisible={isSharePromptVisible}
      onDeliveryDateChange={setDeliveryDate}
      onSubmitOrder={() => {
        void handleSubmitOrder();
      }}
      onShareOrderBon={(order) => {
        void (async () => {
          const result = await downloadOrderBon(order, { preferShare: true });

          if (result === 'shared') {
            setIsSharePromptVisible(false);
            router.replace('/order-history');
          }
        })();
      }}
      onDownloadOrderBon={(order) => {
        void downloadOrderBon(order);
      }}
      onCloseSharePrompt={() => {
        setIsSharePromptVisible(false);
      }}
      onBack={() => {
        router.replace('/orders');
      }}
    />
  );
}
