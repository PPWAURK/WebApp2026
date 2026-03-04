import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LANGUAGE_KEY } from '../constants/storage';
import { translations } from '../locales/translations';
import type { Language } from '../types/language';

type LanguageContextValue = {
  isLoadingLanguage: boolean;
  language: Language;
  text: (typeof translations)[Language];
  setLanguage: (languageValue: Language) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage === 'fr' || savedLanguage === 'zh') {
          setLanguageState(savedLanguage);
        }
      } finally {
        setIsLoadingLanguage(false);
      }
    }

    void loadLanguage();
  }, []);

  async function setLanguage(languageValue: Language) {
    setLanguageState(languageValue);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageValue);
  }

  return (
    <LanguageContext.Provider
      value={{
        isLoadingLanguage,
        language,
        text: translations[language],
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
