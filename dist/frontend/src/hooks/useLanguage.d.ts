import { type ReactNode } from 'react';
import { translations } from '../locales/translations';
import type { Language } from '../types/language';
type LanguageContextValue = {
    isLoadingLanguage: boolean;
    language: Language;
    text: (typeof translations)[Language];
    setLanguage: (languageValue: Language) => Promise<void>;
};
export declare function LanguageProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useLanguage(): LanguageContextValue;
export {};
