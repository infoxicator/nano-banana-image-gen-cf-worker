import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import ImageUpload from './components/ImageUpload'
import PromptInput from './components/PromptInput'
import MonthDayPicker from './components/MonthDayPicker'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import LanguageToggle from './components/LanguageToggle'
import { useLanguage } from './i18n'
import './App.css'

interface GenerationResult {
  success: boolean;
  htmlContent?: string;
  error?: string;
}

// Function to sanitize HTML content by removing markdown code blocks and escape characters
const sanitizeHtmlContent = (htmlString: string): string => {
  let cleaned = htmlString;
  
  // Remove markdown code block markers
  cleaned = cleaned.replace(/^```html\s*/i, '');
  cleaned = cleaned.replace(/\s*```\s*$/, '');
  
  // Remove leading/trailing whitespace and newlines
  cleaned = cleaned.trim();
  
  // Remove any remaining escape sequences that might break rendering
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\r/g, '\r');
  cleaned = cleaned.replace(/\\t/g, '\t');
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\'/g, "'");
  
  return cleaned;
};

function App() {
  const { t, language } = useLanguage()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [sharedImageUrl, setSharedImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const htmlContentRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setResult(null)
    setError(null)
    if (!file) {
      setUploadedImageUrl('')
    }
  }

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl)
  }

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const handleDownload = async () => {
    if (!htmlContentRef.current) return

    setIsDownloading(true)
    try {
      const canvas = await html2canvas(htmlContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      })

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        link.download = `newspaper-${selectedDate || 'generated'}-${timestamp}.png`
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Cleanup
        URL.revokeObjectURL(url)
      }, 'image/png')

    } catch (error) {
      console.error('Error downloading image:', error)
      setError('Failed to download image. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const uploadImageForSharing = async (): Promise<string | null> => {
    if (!htmlContentRef.current) return null

    setIsUploading(true)
    try {
      // Generate image using html2canvas
      const canvas = await html2canvas(htmlContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      })

      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null)
            return
          }

          try {
            // Create form data
            const formData = new FormData()
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
            const filename = `newspaper-${selectedDate || 'generated'}-${timestamp}.png`
            formData.append('image', blob, filename)

            // Upload to R2
            const response = await fetch('/api/upload-generated', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              throw new Error('Failed to upload image')
            }

            const data = await response.json() as { imageUrl: string; success: boolean; message?: string }
            resolve(data.imageUrl)
          } catch (error) {
            console.error('Error uploading image:', error)
            resolve(null)
          }
        }, 'image/png')
      })
    } catch (error) {
      console.error('Error generating image for sharing:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleShareFacebook = async () => {
    // Get or upload the image URL
    let imageUrl = sharedImageUrl
    if (!imageUrl) {
      imageUrl = await uploadImageForSharing()
      if (imageUrl) {
        setSharedImageUrl(imageUrl)
      }
    }

    if (!imageUrl) {
      alert(t.errorFailedToPrepareSharing)
      return
    }

    const text = encodeURIComponent(`${t.facebookShareText} ${imageUrl}`)
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${text}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleShareTwitter = async () => {
    // Get or upload the image URL
    let imageUrl = sharedImageUrl
    if (!imageUrl) {
      imageUrl = await uploadImageForSharing()
      if (imageUrl) {
        setSharedImageUrl(imageUrl)
      }
    }

    if (!imageUrl) {
      alert(t.errorFailedToPrepareSharing)
      return
    }

    const text = encodeURIComponent(t.twitterShareText)
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(imageUrl)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleShareInstagram = async () => {
    // Get or upload the image URL
    let imageUrl = sharedImageUrl
    if (!imageUrl) {
      imageUrl = await uploadImageForSharing()
      if (imageUrl) {
        setSharedImageUrl(imageUrl)
      }
    }

    if (!imageUrl) {
      alert(t.errorFailedToPrepareSharing)
      return
    }

    try {
      const message = `${t.instagramShareMessage} ${imageUrl}`
      await navigator.clipboard.writeText(message)
      alert(t.instagramShareSuccess)
    } catch (err) {
      console.error('Failed to copy link:', err)
      alert(`${t.instagramShareFallback}\n\n${imageUrl}\n\n${t.instagramShareMessage.split('\n')[0]}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadedImageUrl || !selectedDate) {
      setError(t.errorSelectDateAndImage)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setSharedImageUrl(null) // Clear previous shared image URL

    try {
      const response = await fetch('https://postman.flows.pstmn.io/api/default/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          prompt: prompt.trim() || '',
          date: selectedDate,
          language: language
        })
      })

      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || t.errorFailedToProcess)
      }

      const rawHtmlContent = await response.text()
      console.log('Raw HTML content:', rawHtmlContent)
      
      const sanitizedHtmlContent = sanitizeHtmlContent(rawHtmlContent)
      console.log('Sanitized HTML content:', sanitizedHtmlContent)
      
      setResult({ success: true, htmlContent: sanitizedHtmlContent })
      
    } catch (err) {
      console.error('Error processing request:', err)
      setError(err instanceof Error ? err.message : t.errorUnknown)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="newspaper-container">
        <header className="newspaper-header">
          <LanguageToggle />
          <div className="masthead">
            <h1 className="newspaper-title">{t.title}</h1>
            <div className="newspaper-subtitle">
              {t.subtitle}
            </div>
            <div className="newspaper-divider"></div>
            <div className="instructions">
              <h3 className="instructions-title">{t.instructionsTitle}</h3>
              <div className="instructions-content">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>{t.step1Title}</strong> {t.step1Description}
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>{t.step2Title}</strong> {t.step2Description}
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>{t.step3Title}</strong> {t.step3Description}
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <strong>{t.step4Title}</strong> {t.step4Description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <form onSubmit={handleSubmit} className="newspaper-form">
          <section className="date-section">
            <MonthDayPicker
              value={selectedDate}
              onChange={handleDateChange}
            />
          </section>
          
          <section className="image-section">
            <ImageUpload 
              onFileSelect={handleFileSelect}
              onImageUploaded={handleImageUploaded}
              selectedFile={selectedFile}
            />
          </section>
          
          <section className="prompt-section">
            <PromptInput 
              value={prompt}
              onChange={handlePromptChange}
            />
          </section>
          
          <div className="submit-section">
            <button 
              type="submit" 
              className="newspaper-btn"
              disabled={isLoading || !uploadedImageUrl || !selectedDate}
            >
              {isLoading ? t.submitButtonLoading : t.submitButton}
            </button>
          </div>
        </form>

        {isLoading && <LoadingSpinner />}
        
        {error && <ErrorMessage message={error} />}
        
        {result?.success && result.htmlContent && (
          <div className="result">
            <h3 className="result-title">
              <span className="emoji">✨</span>
              {t.resultTitle}
            </h3>
            <div className="html-content-container" ref={htmlContentRef}>
              <div
                className="generated-html"
                dangerouslySetInnerHTML={{ __html: result.htmlContent }}
              />
            </div>
            <div className="download-section">
              <button 
                onClick={handleDownload}
                className="download-btn"
                disabled={isDownloading}
              >
                {isDownloading ? t.downloadButtonLoading : t.downloadButton}
              </button>
              
              <div className="share-buttons">
                <h4 className="share-title">{t.shareTitle}</h4>
                <div className="share-buttons-row">
                  <button 
                    onClick={handleShareFacebook}
                    className="share-btn facebook-btn"
                    type="button"
                    disabled={isUploading}
                  >
                    <span className="share-icon">
                      {isUploading ? '⏳' : '📘'}
                    </span>
                    {isUploading ? t.shareButtonLoading : t.facebookButton}
                  </button>
                  <button 
                    onClick={handleShareTwitter}
                    className="share-btn twitter-btn"
                    type="button"
                    disabled={isUploading}
                  >
                    <span className="share-icon">
                      {isUploading ? '⏳' : '🐦'}
                    </span>
                    {isUploading ? t.shareButtonLoading : t.twitterButton}
                  </button>
                  <button 
                    onClick={handleShareInstagram}
                    className="share-btn instagram-btn"
                    type="button"
                    disabled={isUploading}
                  >
                    <span className="share-icon">
                      {isUploading ? '⏳' : '📸'}
                    </span>
                    {isUploading ? t.shareButtonLoading : t.instagramButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App