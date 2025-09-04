import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  // Check for Spanish variants
  if (browserLang.startsWith('es')) {
    return 'es';
  }
  
  // Default to English
  return 'en';
};

// Get stored language or detect from browser
const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem('preferred-language') as Language;
    if (stored && (stored === 'en' || stored === 'es')) {
      return stored;
    }
  } catch (error) {
    // localStorage might not be available
    console.warn('Could not access localStorage:', error);
  }
  
  return detectBrowserLanguage();
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    
    // Store preference in localStorage
    try {
      localStorage.setItem('preferred-language', newLanguage);
    } catch (error) {
      console.warn('Could not save language preference:', error);
    }
  };

  // Get translations for current language
  const t = translations[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};