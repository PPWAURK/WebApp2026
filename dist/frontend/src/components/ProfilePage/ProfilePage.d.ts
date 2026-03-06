import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
type ProfilePageProps = {
    text: AppText;
    user: User;
    accessToken: string;
    isUploadingPhoto: boolean;
    error: string | null;
    onUploadStart: () => void;
    onUploadFinish: () => void;
    onUploadError: (message: string) => void;
    onUserUpdate: (user: User) => void;
};
export declare function ProfilePage({ text, user, accessToken, isUploadingPhoto, error, onUploadStart, onUploadFinish, onUploadError, onUserUpdate, }: ProfilePageProps): import("react").JSX.Element;
export {};
