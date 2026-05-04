import { Redirect, useRouter } from 'expo-router';
import { OrdersPage } from '../../src/components/OrdersPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderFlow } from '../../src/hooks/useOrderFlow';
import type { OrderRecapData } from '../../src/types/order';
import { canUserAccessOrders } from '../../src/utils/orderAccess';

export default function OrdersScreen() {
  const auth = useAuth();
  const language = useLanguage();
  const router = useRouter();

  const {
    setOrderRecap,
    orderQuantities,
    setOrderQuantities,
    selectedOrderSupplierId,
    setSelectedOrderSupplierId,
    selectedOrderCategoryId,
    setSelectedOrderCategoryId,
    orderProductSearch,
    setOrderProductSearch,
    setLatestCreatedOrder,
  } = useOrderFlow();

  if (!auth.session) {
    return null;
  }

  if (!canUserAccessOrders(auth.session.user)) {
    return <Redirect href="/dashboard" />;
  }

  function handleProceedToOrderRecap(recap: OrderRecapData) {
    setOrderRecap(recap);
    setLatestCreatedOrder(null);
    router.push('/order-recap');
  }

  return (
    <OrdersPage
      text={language.text}
      accessToken={auth.session.accessToken}
      language={language.language}
      quantities={orderQuantities}
      selectedSupplierId={selectedOrderSupplierId}
      selectedCategoryId={selectedOrderCategoryId}
      productSearch={orderProductSearch}
      onQuantitiesChange={setOrderQuantities}
      onSelectedSupplierIdChange={setSelectedOrderSupplierId}
      onSelectedCategoryChange={setSelectedOrderCategoryId}
      onProductSearchChange={setOrderProductSearch}
      onSubmitOrder={handleProceedToOrderRecap}
    />
  );
}
