import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import ImageUpload from './components/ImageUpload'
import PromptInput from './components/PromptInput'
import MonthDayPicker from './components/MonthDayPicker'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import LanguageToggle from './components/LanguageToggle'
import ForNerds from './components/ForNerds'
import { useLanguage } from './i18n'
import './App.css'

interface GenerationResult {
  success: boolean;
  htmlContent?: string;
  error?: string;
}

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

// Function to get user-friendly error messages
const getUserFriendlyErrorMessage = (errorMessage: string, language: string): string => {
  const translations = {
    en: {
      aiServiceError: "The AI service encountered an issue. Please try again with a different image or prompt.",
      networkError: "Network connection issue. Please check your internet connection and try again.",
      imageError: "There was a problem processing your image. Please try uploading a different image.",
      serverError: "Our servers are experiencing issues. Please try again in a few minutes.",
      invalidRequest: "There was an issue with your request. Please check your inputs and try again.",
      default: "Something went wrong. Please try again."
    },
    es: {
      aiServiceError: "El servicio de IA encontró un problema. Por favor, inténtalo de nuevo con una imagen o descripción diferente.",
      networkError: "Problema de conexión de red. Por favor, verifica tu conexión a internet e inténtalo de nuevo.",
      imageError: "Hubo un problema procesando tu imagen. Por favor, intenta subir una imagen diferente.",
      serverError: "Nuestros servidores están experimentando problemas. Por favor, inténtalo de nuevo en unos minutos.",
      invalidRequest: "Hubo un problema con tu solicitud. Por favor, verifica tus datos e inténtalo de nuevo.",
      default: "Algo salió mal. Por favor, inténtalo de nuevo."
    }
  };

  const lang = language as 'en' | 'es';
  const t = translations[lang] || translations.en;

  if (errorMessage.includes('AI service') || errorMessage.includes('generate')) {
    return t.aiServiceError;
  } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return t.networkError;
  } else if (errorMessage.includes('image')) {
    return t.imageError;
  } else if (errorMessage.includes('server') || errorMessage.includes('503') || errorMessage.includes('502')) {
    return t.serverError;
  } else if (errorMessage.includes('request') || errorMessage.includes('400')) {
    return t.invalidRequest;
  } else {
    return t.default;
  }
};

function App() {
  const { t, language } = useLanguage()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [, setUploadedImageUrl] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<DetailedError | string | null>(null)
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
      // Temporarily apply export-specific styles
      const originalStyle = htmlContentRef.current.style.cssText
      const originalContainerStyle = htmlContentRef.current.parentElement?.style.cssText || ''
      
      // Apply fixed dimensions for export
      htmlContentRef.current.style.cssText += `
        width: 800px !important;
        min-height: 600px !important;
        max-width: none !important;
        position: relative !important;
        box-sizing: border-box !important;
      `
      
      if (htmlContentRef.current.parentElement) {
        htmlContentRef.current.parentElement.style.cssText += `
          width: 800px !important;
          max-width: none !important;
          overflow: visible !important;
        `
      }
      
      const canvas = await html2canvas(htmlContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })
      
      // Restore original styles
      htmlContentRef.current.style.cssText = originalStyle
      if (htmlContentRef.current.parentElement) {
        htmlContentRef.current.parentElement.style.cssText = originalContainerStyle
      }

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
      // Temporarily apply export-specific styles
      const originalStyle = htmlContentRef.current.style.cssText
      const originalContainerStyle = htmlContentRef.current.parentElement?.style.cssText || ''
      
      // Apply fixed dimensions for export
      htmlContentRef.current.style.cssText += `
        width: 800px !important;
        min-height: 600px !important;
        max-width: none !important;
        position: relative !important;
        box-sizing: border-box !important;
      `
      
      if (htmlContentRef.current.parentElement) {
        htmlContentRef.current.parentElement.style.cssText += `
          width: 800px !important;
          max-width: none !important;
          overflow: visible !important;
        `
      }
      
      // Generate image using html2canvas
      const canvas = await html2canvas(htmlContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })
      
      // Restore original styles
      htmlContentRef.current.style.cssText = originalStyle
      if (htmlContentRef.current.parentElement) {
        htmlContentRef.current.parentElement.style.cssText = originalContainerStyle
      }

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
    
    if (!selectedFile || !selectedDate) {
      setError(t.errorSelectDateAndImage)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setSharedImageUrl(null) // Clear previous shared image URL

    try {
      const trimmedPrompt = prompt.trim()
      const formData = new FormData()
      formData.append('image', selectedFile, selectedFile.name)
      formData.append('prompt', trimmedPrompt)
      formData.append('date', selectedDate)
      formData.append('language', language)

      const response = await fetch('https://postman.flows.pstmn.io/api/default/iwastheretodayformdata', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorData: any
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: 'Failed to parse error response' }
        }

        // Create detailed error object
        const detailedError: DetailedError = {
          userMessage: getUserFriendlyErrorMessage(errorData.error || t.errorFailedToProcess, language),
          technicalDetails: {
            error: errorData.error || 'Unknown error',
            details: errorData.details || 'No additional details available',
            timestamp: errorData.timestamp || new Date().toISOString(),
            requestInfo: errorData.requestInfo || {
              language: language,
              hasDate: !!selectedDate,
              hasPrompt: !!trimmedPrompt
            },
            httpStatus: response.status,
            httpHeaders: (() => {
              const headers: Record<string, string> = {}
              response.headers.forEach((value, key) => {
                headers[key] = value
              })
              return headers
            })()
          }
        }

        setError(detailedError)
        return
      }

      const rawHtmlContent = await response.text()
      console.log('Raw HTML content:', rawHtmlContent)
      
      const sanitizedHtmlContent = sanitizeHtmlContent(rawHtmlContent)
      console.log('Sanitized HTML content:', sanitizedHtmlContent)
      
      setResult({ success: true, htmlContent: sanitizedHtmlContent })
      
    } catch (err) {
      console.error('Error processing request:', err)
      const errorMessage = err instanceof Error ? err.message : t.errorUnknown
      
      // If it's not already a DetailedError, create a simple error
      const simpleError: DetailedError = {
        userMessage: getUserFriendlyErrorMessage(errorMessage, language),
        technicalDetails: {
          error: errorMessage,
          details: err instanceof Error ? err.stack || 'No stack trace available' : 'Unknown error type',
          timestamp: new Date().toISOString(),
          requestInfo: {
            language: language,
            hasDate: !!selectedDate,
            hasPrompt: !!prompt.trim()
          },
          httpStatus: 0
        }
      }
      setError(simpleError)
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
              disabled={isLoading || !selectedFile || !selectedDate}
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
        
        <ForNerds />
      </div>
    </div>
  )
}

export default App
