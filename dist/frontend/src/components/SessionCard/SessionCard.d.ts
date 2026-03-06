import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
type SessionCardProps = {
    user: User;
    accessToken: string;
    text: AppText;
};
export declare function SessionCard({ user, accessToken, text, }: SessionCardProps): import("react").JSX.Element;
export {};
