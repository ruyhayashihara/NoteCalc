import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'light' | 'dark' | 'midnight' | 'ocean' | 'forest' | 'sunset' | 'minimal' | 'retro';

export interface Theme {
  name: ThemeName;
  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    border: string;
    primary: string;
    primaryHover: string;
    text: string;
    textSecondary: string;
    accent: string;
    calculatorBg: string;
    keypadBg: string;
    keyDefault: string;
    keyOperator: string;
    keyAccent: string;
    keyText: string;
    keyOperatorText: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    colors: {
      background: '#f2f3f5',
      surface: '#ffffff',
      surfaceSecondary: '#f8f9fa',
      border: '#e0e0e0',
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#3b82f6',
      calculatorBg: '#f2f3f5',
      keypadBg: '#e2e6eb',
      keyDefault: '#f4f5f7',
      keyOperator: '#b6c7d5',
      keyAccent: '#cb7145',
      keyText: '#1f2937',
      keyOperatorText: '#1f2937',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#1a1a2e',
      surface: '#16213e',
      surfaceSecondary: '#0f3460',
      border: '#2d3748',
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      text: '#f3f4f6',
      textSecondary: '#9ca3af',
      accent: '#818cf8',
      calculatorBg: '#1a1a2e',
      keypadBg: '#2d3748',
      keyDefault: '#374151',
      keyOperator: '#4b5563',
      keyAccent: '#ef4444',
      keyText: '#f3f4f6',
      keyOperatorText: '#f3f4f6',
    },
  },
  midnight: {
    name: 'midnight',
    colors: {
      background: '#0d1117',
      surface: '#161b22',
      surfaceSecondary: '#21262d',
      border: '#30363d',
      primary: '#58a6ff',
      primaryHover: '#79c0ff',
      text: '#c9d1d9',
      textSecondary: '#8b949e',
      accent: '#bc8cff',
      calculatorBg: '#0d1117',
      keypadBg: '#21262d',
      keyDefault: '#30363d',
      keyOperator: '#3d444d',
      keyAccent: '#f78166',
      keyText: '#c9d1d9',
      keyOperatorText: '#ffffff',
    },
  },
  ocean: {
    name: 'ocean',
    colors: {
      background: '#0c1929',
      surface: '#0d2137',
      surfaceSecondary: '#132f4c',
      border: '#1a456e',
      primary: '#0ea5e9',
      primaryHover: '#38bdf8',
      text: '#e0f2fe',
      textSecondary: '#7dd3fc',
      accent: '#14b8a6',
      calculatorBg: '#0c1929',
      keypadBg: '#132f4c',
      keyDefault: '#1a456e',
      keyOperator: '#1e5a8e',
      keyAccent: '#0d9488',
      keyText: '#e0f2fe',
      keyOperatorText: '#ffffff',
    },
  },
  forest: {
    name: 'forest',
    colors: {
      background: '#0f1c15',
      surface: '#14291f',
      surfaceSecondary: '#1a3829',
      border: '#2d4a3a',
      primary: '#22c55e',
      primaryHover: '#4ade80',
      text: '#dcfce7',
      textSecondary: '#86efac',
      accent: '#10b981',
      calculatorBg: '#0f1c15',
      keypadBg: '#1a3829',
      keyDefault: '#2d4a3a',
      keyOperator: '#36614a',
      keyAccent: '#059669',
      keyText: '#dcfce7',
      keyOperatorText: '#ffffff',
    },
  },
  sunset: {
    name: 'sunset',
    colors: {
      background: '#1a0f0f',
      surface: '#241414',
      surfaceSecondary: '#331818',
      border: '#4a2525',
      primary: '#fb923c',
      primaryHover: '#fdba74',
      text: '#fed7aa',
      textSecondary: '#fdba74',
      accent: '#f43f5e',
      calculatorBg: '#1a0f0f',
      keypadBg: '#331818',
      keyDefault: '#4a2525',
      keyOperator: '#5c2d2d',
      keyAccent: '#e11d48',
      keyText: '#fed7aa',
      keyOperatorText: '#ffffff',
    },
  },
  minimal: {
    name: 'minimal',
    colors: {
      background: '#fafafa',
      surface: '#ffffff',
      surfaceSecondary: '#f5f5f5',
      border: '#e5e5e5',
      primary: '#171717',
      primaryHover: '#404040',
      text: '#171717',
      textSecondary: '#737373',
      accent: '#a3a3a3',
      calculatorBg: '#fafafa',
      keypadBg: '#f5f5f5',
      keyDefault: '#ffffff',
      keyOperator: '#e5e5e5',
      keyAccent: '#171717',
      keyText: '#171717',
      keyOperatorText: '#171717',
    },
  },
  retro: {
    name: 'retro',
    colors: {
      background: '#f0e6d2',
      surface: '#fff8dc',
      surfaceSecondary: '#faebd7',
      border: '#deb887',
      primary: '#cd853f',
      primaryHover: '#daa520',
      text: '#3e2723',
      textSecondary: '#5d4037',
      accent: '#d2691e',
      calculatorBg: '#f0e6d2',
      keypadBg: '#deb887',
      keyDefault: '#f5deb3',
      keyOperator: '#daa520',
      keyAccent: '#cd853f',
      keyText: '#3e2723',
      keyOperatorText: '#ffffff',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calc-theme');
      if (saved && Object.keys(themes).includes(saved)) {
        return saved as ThemeName;
      }
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('calc-theme', themeName);
  }, [themeName]);

  const value = {
    theme: themes[themeName],
    themeName,
    setTheme: setThemeName,
    availableThemes: Object.keys(themes) as ThemeName[],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
