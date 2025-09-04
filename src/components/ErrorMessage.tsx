import React, { useState } from 'react'

interface DetailedError {
  userMessage: string;
  technicalDetails: {
    error: string;
    details: string;
    timestamp: string;
    requestInfo: {
      language: string;
      hasDate: boolean;
      hasPrompt: boolean;
    };
    httpStatus: number;
    httpHeaders?: Record<string, string>;
  };
}

interface ErrorMessageProps {
  message: string | DetailedError
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const [showDetails, setShowDetails] = useState(false)

  if (typeof message === 'string') {
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

  const detailedError = message as DetailedError
  
  return (
    <div className="error detailed-error">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h4>Error</h4>
        <p className="user-message">{detailedError.userMessage}</p>
        
        <div className="error-actions">
          <button 
            className="toggle-details-btn" 
            onClick={() => setShowDetails(!showDetails)}
            type="button"
          >
            {showDetails ? '🔼 Hide Technical Details' : '🔽 Show Technical Details'}
          </button>
        </div>

        {showDetails && (
          <div className="technical-details">
            <div className="detail-section">
              <h5>Error Details</h5>
              <p><strong>Message:</strong> {detailedError.technicalDetails.error}</p>
              <p><strong>Additional Info:</strong> {detailedError.technicalDetails.details}</p>
              <p><strong>Timestamp:</strong> {new Date(detailedError.technicalDetails.timestamp).toLocaleString()}</p>
              <p><strong>HTTP Status:</strong> {detailedError.technicalDetails.httpStatus}</p>
            </div>
            
            <div className="detail-section">
              <h5>Request Information</h5>
              <p><strong>Language:</strong> {detailedError.technicalDetails.requestInfo.language}</p>
              <p><strong>Has Date:</strong> {detailedError.technicalDetails.requestInfo.hasDate ? 'Yes' : 'No'}</p>
              <p><strong>Has Prompt:</strong> {detailedError.technicalDetails.requestInfo.hasPrompt ? 'Yes' : 'No'}</p>
            </div>
            
            {detailedError.technicalDetails.httpHeaders && (
              <div className="detail-section">
                <h5>HTTP Headers (Relevant)</h5>
                <div className="headers-list">
                  {Object.entries(detailedError.technicalDetails.httpHeaders)
                    .filter(([key]) => ['content-type', 'server', 'cf-ray', 'date'].includes(key.toLowerCase()))
                    .map(([key, value]) => (
                      <p key={key}><strong>{key}:</strong> {value}</p>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage