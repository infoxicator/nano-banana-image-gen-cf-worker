import React from 'react';
import { useLanguage } from '../i18n';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="language-toggle">
      <button 
        onClick={toggleLanguage}
        className="language-toggle-btn"
        title={t.language}
        aria-label={`${t.language}: ${language === 'en' ? t.languageEnglish : t.languageSpanish}`}
      >
        <span className="language-flag">
          {language === 'en' ? '🇬🇧' : '🇪🇸'}
        </span>
        <span className="language-text">
          {language === 'en' ? 'EN' : 'ES'}
        </span>
      </button>
    </div>
  );
};

export default LanguageToggle;