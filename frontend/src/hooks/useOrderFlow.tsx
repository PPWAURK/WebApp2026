import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from 'react';
import type { OrderRecapData } from '../types/order';

type LatestCreatedOrder = {
  id: number;
  number: string;
  bonUrl: string;
};

type OrderFlowContextValue = {
  orderRecap: OrderRecapData | null;
  setOrderRecap: Dispatch<SetStateAction<OrderRecapData | null>>;
  orderQuantities: Record<number, number>;
  setOrderQuantities: Dispatch<SetStateAction<Record<number, number>>>;
  selectedOrderSupplierId: number | 'ALL';
  setSelectedOrderSupplierId: Dispatch<SetStateAction<number | 'ALL'>>;
  selectedOrderCategory: string;
  setSelectedOrderCategory: Dispatch<SetStateAction<string>>;
  orderProductSearch: string;
  setOrderProductSearch: Dispatch<SetStateAction<string>>;
  deliveryDate: string;
  setDeliveryDate: Dispatch<SetStateAction<string>>;
  latestCreatedOrder: LatestCreatedOrder | null;
  setLatestCreatedOrder: Dispatch<SetStateAction<LatestCreatedOrder | null>>;
  resetOrderDraft: () => void;
};

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null);

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function OrderFlowProvider({ children }: { children: ReactNode }) {
  const [orderRecap, setOrderRecap] = useState<OrderRecapData | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<number, number>>(
    {},
  );
  const [selectedOrderSupplierId, setSelectedOrderSupplierId] = useState<
    number | 'ALL'
  >('ALL');
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<string>('ALL');
  const [orderProductSearch, setOrderProductSearch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateString());
  const [latestCreatedOrder, setLatestCreatedOrder] =
    useState<LatestCreatedOrder | null>(null);

  function resetOrderDraft() {
    setOrderRecap(null);
    setOrderQuantities({});
    setSelectedOrderSupplierId('ALL');
    setSelectedOrderCategory('ALL');
    setOrderProductSearch('');
    setDeliveryDate(getTodayDateString());
    setLatestCreatedOrder(null);
  }

  return (
    <OrderFlowContext.Provider
      value={{
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
      }}
    >
      {children}
    </OrderFlowContext.Provider>
  );
}

export function useOrderFlow() {
  const context = useContext(OrderFlowContext);

  if (!context) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider');
  }

  return context;
}
