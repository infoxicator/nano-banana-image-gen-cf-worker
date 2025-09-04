import React from 'react'
import { useLanguage } from '../i18n'

const LoadingSpinner: React.FC = () => {
  const { t } = useLanguage()
  
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p className="loading-text">
        <span className="emoji">🎨</span>
        {t.loadingMessage}
      </p>
    </div>
  )
}

export default LoadingSpinner