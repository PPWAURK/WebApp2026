import type { AppText } from '../../locales/translations';
import { type OrderSummary } from '../../services/ordersApi';
type OrderHistoryPageProps = {
    text: AppText;
    accessToken: string;
    orders: OrderSummary[];
    isLoading: boolean;
    deletingOrderId: number | null;
    onRefresh: () => void;
    onDownloadOrderBon: (order: {
        id: number;
        bonUrl: string;
        number?: string;
    }) => void;
    onDeleteOrder: (order: OrderSummary) => void;
};
export declare function OrderHistoryPage({ text, accessToken, orders, isLoading, deletingOrderId, onRefresh, onDownloadOrderBon, onDeleteOrder, }: OrderHistoryPageProps): import("react").JSX.Element;
export {};
