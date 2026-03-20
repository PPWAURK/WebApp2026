import { Redirect, useRouter } from 'expo-router';
import { OrdersPage } from '../../src/components/OrdersPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useOrderFlow } from '../../src/hooks/useOrderFlow';
import type { Role } from '../../src/types/auth';
import type { OrderRecapData } from '../../src/types/order';

function canAccessOrders(role: Role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

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
    selectedOrderCategory,
    setSelectedOrderCategory,
    orderProductSearch,
    setOrderProductSearch,
    setLatestCreatedOrder,
  } = useOrderFlow();

  if (!auth.session) {
    return null;
  }

  if (!canAccessOrders(auth.session.user.role)) {
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
