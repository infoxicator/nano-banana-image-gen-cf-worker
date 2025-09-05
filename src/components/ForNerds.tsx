import React, { useState } from 'react';
import { useLanguage } from '../i18n';

const ForNerds: React.FC = () => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="for-nerds">
      <button 
        className="for-nerds-toggle" 
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        🤓 {t.forNerdsTitle} {isExpanded ? '▲' : '▼'}
      </button>
      
      {isExpanded && (
        <div className="for-nerds-content">
          <p className="for-nerds-description">
            {t.forNerdsDescription}
          </p>
          
          <div className="for-nerds-video">
            <p className="video-label">{t.forNerdsWatchVideo}:</p>
            <div className="video-container">
              <iframe
                src="https://www.youtube.com/embed/y9dDVLVIGTA?si=fd0-kNTaGyKLaYSz"
                title="How it's built - Technical explanation"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
          
          <div className="tech-details">
            <h4>Tech Stack:</h4>
            <ul>
              <li><strong>Frontend:</strong> React + TypeScript</li>
              <li><strong>Backend:</strong> Cloudflare Workers / Postman Flows</li>
              <li><strong>AI:</strong> Google Gemini AI</li>
              <li><strong>Storage:</strong> Cloudflare R2</li>
              <li><strong>Styling:</strong> Custom CSS</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForNerds;