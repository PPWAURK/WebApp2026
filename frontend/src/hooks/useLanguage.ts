import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LANGUAGE_KEY } from '../constants/storage';
import { translations } from '../locales/translations';
import type { Language } from '../types/language';

export function useLanguage() {
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

  return {
    isLoadingLanguage,
    language,
    text: translations[language],
    setLanguage,
  };
}
