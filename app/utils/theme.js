import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Simple theme for now
const lightTheme = {
  colors: {
    primary: '#2563EB',
    background: '#F9FAFB',
    cardBackground: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
  },
};

const darkTheme = {
  colors: {
    primary: '#3B82F6',
    background: '#111827',
    cardBackground: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    danger: '#EF4444',
  },
};

// Create context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (newTheme) => {
    try {
      setThemeMode(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine which theme to use
  const getActualTheme = () => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getActualTheme();
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, changeTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Default export (to fix Expo Router warning)
export default function ThemeContextProvider({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}