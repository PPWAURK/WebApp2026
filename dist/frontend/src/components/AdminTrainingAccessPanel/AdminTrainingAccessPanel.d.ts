import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
type AdminTrainingAccessPanelProps = {
    accessToken: string;
    currentUser: User;
    text: AppText;
};
export declare function AdminTrainingAccessPanel({ accessToken, text, }: AdminTrainingAccessPanelProps): import("react").JSX.Element;
export {};
