import type { AppText } from '../../locales/translations';
import type { Language } from '../../types/language';
import type { MenuPage } from '../../types/menu';
import type { User } from '../../types/auth';
type HeaderDrawerProps = {
    isOpen: boolean;
    text: AppText;
    language: Language;
    currentUser: User;
    activePage: MenuPage;
    onToggle: () => void;
    onClose: () => void;
    onSelectPage: (page: MenuPage) => void;
    onSelectLanguage: (language: Language) => void;
    onLogout: () => void;
};
export declare function HeaderDrawer(props: HeaderDrawerProps): import("react").JSX.Element;
export {};
