import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Simple translations for now
const translations = {
  sq: {
    hello: 'Ckemi',
    welcome: 'Mirë se vini',
    urbanSupervisor: 'Mbikëqyrës Urban',
    welcomeToDashboard: 'Mirë se vini në panelin tuaj',
    activeReportsMap: 'Harta e Raporteve Aktive',
    viewFullMap: 'Shiko Hartën e Plotë',
    filterByCategory: 'Filtro sipas Kategorisë',
    all: 'Të Gjitha',
    infrastructure: 'Infrastrukturë',
    environment: 'Mjedisi',
    security: 'Siguria',
    other: 'Të Tjera',
    latestReports: 'Raportet e Fundit',
    newReport: 'Raport i Ri',
    quickActions: 'Veprime të Shpejta',
    analytics: 'Analitikë',
    profile: 'Profili',
    settings: 'Cilësimet',
    logout: 'Dil',
    totalReports: 'Raportet Total',
    resolved: 'Të Zgjidhura',
    pending: 'Në Pritje',
    urgent: 'Urgjente',
    unknownLocation: 'Lokacion i panjohur',
    loading: 'Duke ngarkuar...',
  },
  en: {
    hello: 'Hello',
    welcome: 'Welcome',
    urbanSupervisor: 'Urban Supervisor',
    welcomeToDashboard: 'Welcome to your dashboard',
    activeReportsMap: 'Active Reports Map',
    viewFullMap: 'View Full Map',
    filterByCategory: 'Filter by Category',
    all: 'All',
    infrastructure: 'Infrastructure',
    environment: 'Environment',
    security: 'Security',
    other: 'Other',
    latestReports: 'Latest Reports',
    newReport: 'New Report',
    quickActions: 'Quick Actions',
    analytics: 'Analytics',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    totalReports: 'Total Reports',
    resolved: 'Resolved',
    pending: 'Pending',
    urgent: 'Urgent',
    unknownLocation: 'Unknown location',
    loading: 'Loading...',
  }
};

// Create context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('sq');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && (savedLanguage === 'sq' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      setLanguage(newLanguage);
      await AsyncStorage.setItem('appLanguage', newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert('Error', 'Failed to save language preference');
    }
  };

  // Translation function
  const t = (key, params = {}) => {
    let translation = translations[language][key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  };

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use translations
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Default export (to fix Expo Router warning)
export default function LanguageContextProvider({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}