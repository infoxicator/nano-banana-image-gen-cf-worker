import React from 'react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p className="loading-text">
        <span className="emoji">🎨</span>
        Generating your image... This may take a moment.
      </p>
    </div>
  )
}

export default LoadingSpinner