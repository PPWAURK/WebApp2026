import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { THEME_KEY } from '../constants/storage';
import type { AppTheme } from '../types/theme';

type ThemeContextValue = {
  isLoadingTheme: boolean;
  theme: AppTheme;
  setTheme: (themeValue: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [theme, setThemeState] = useState<AppTheme>('light');

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      } finally {
        setIsLoadingTheme(false);
      }
    }

    void loadTheme();
  }, []);

  async function setTheme(themeValue: AppTheme) {
    setThemeState(themeValue);
    await AsyncStorage.setItem(THEME_KEY, themeValue);
  }

  async function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        isLoadingTheme,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
