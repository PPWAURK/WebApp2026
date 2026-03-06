import type { AppText } from '../../locales/translations';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';
type OrderRecapPageProps = {
    text: AppText;
    language: Language;
    recap: OrderRecapData;
    deliveryDate: string;
    deliveryAddress: string;
    isSubmittingOrder: boolean;
    submitError: string | null;
    latestCreatedOrder: {
        id: number;
        number: string;
        bonUrl: string;
    } | null;
    onDeliveryDateChange: (value: string) => void;
    onSubmitOrder: () => void;
    onDownloadOrderBon: (order: {
        id: number;
        bonUrl: string;
    }) => void;
    onBack: () => void;
};
export declare function OrderRecapPage({ text, language, recap, deliveryDate, deliveryAddress, isSubmittingOrder, submitError, latestCreatedOrder, onDeliveryDateChange, onSubmitOrder, onDownloadOrderBon, onBack, }: OrderRecapPageProps): import("react").JSX.Element;
export {};
