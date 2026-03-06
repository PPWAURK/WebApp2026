import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
type RestaurantFormsPageProps = {
    text: AppText;
    accessToken: string;
    currentUser: User;
};
export declare function RestaurantFormsPage({ text, accessToken, currentUser, }: RestaurantFormsPageProps): import("react").JSX.Element;
export {};
