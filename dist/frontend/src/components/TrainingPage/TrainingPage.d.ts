import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
import type { Language } from '../../types/language';
type TrainingPageProps = {
    text: AppText;
    accessToken: string;
    currentUser: User;
    language: Language;
};
export declare function TrainingPage({ text, accessToken, currentUser, language, }: TrainingPageProps): import("react").JSX.Element;
export {};
