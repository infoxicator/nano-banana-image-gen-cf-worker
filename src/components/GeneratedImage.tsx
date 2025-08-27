import React from 'react'

interface GeneratedImageProps {
  imageData: string
  mimeType: string
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ imageData, mimeType }) => {
  const dataUrl = `data:${mimeType};base64,${imageData}`
  
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'gemini-generated-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="result">
      <h3 className="result-title">
        <span className="emoji">✨</span>
        Generated Image:
      </h3>
      
      <div className="image-container">
        <img 
          src={dataUrl} 
          alt="Generated Image" 
          className="generated-image"
        />
      </div>
      
      <div className="result-actions">
        <button 
          type="button" 
          className="download-btn"
          onClick={handleDownload}
        >
          <span className="emoji">⬇️</span>
          Download Image
        </button>
      </div>
    </div>
  )
}

export default GeneratedImage