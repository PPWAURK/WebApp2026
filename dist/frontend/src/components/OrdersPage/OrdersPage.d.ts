import type { AppText } from '../../locales/translations';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';
type OrdersPageProps = {
    text: AppText;
    accessToken: string;
    language: Language;
    quantities: Record<number, number>;
    onQuantitiesChange: (next: Record<number, number>) => void;
    onSubmitOrder: (recap: OrderRecapData) => void;
};
export declare function OrdersPage({ text, accessToken, language, quantities, onQuantitiesChange, onSubmitOrder, }: OrdersPageProps): import("react").JSX.Element;
export {};
