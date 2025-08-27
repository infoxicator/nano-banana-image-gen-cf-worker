import React from 'react'

interface ErrorMessageProps {
  message: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="error">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h4>Error</h4>
        <p>{message}</p>
      </div>
    </div>
  )
}

export default ErrorMessage