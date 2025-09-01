import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import ImageUpload from './components/ImageUpload'
import PromptInput from './components/PromptInput'
import MonthDayPicker from './components/MonthDayPicker'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadedImageUrl || !selectedDate) {
      setError('Please upload an image and select a date.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('https://postman.flows.pstmn.io/api/default/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          prompt: prompt.trim() || '',
          date: selectedDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process request')
      }

      const rawHtmlContent = await response.text()
      console.log('Raw HTML content:', rawHtmlContent)
      
      const sanitizedHtmlContent = sanitizeHtmlContent(rawHtmlContent)
      console.log('Sanitized HTML content:', sanitizedHtmlContent)
      
      setResult({ success: true, htmlContent: sanitizedHtmlContent })
      
    } catch (err) {
      console.error('Error processing request:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="newspaper-container">
        <header className="newspaper-header">
          <div className="masthead">
            <h1 className="newspaper-title">I Was There!</h1>
            <div className="newspaper-subtitle">
              Upload a picture and select the date to be transported to that place in history
            </div>
            <div className="newspaper-divider"></div>
            <div className="instructions">
              <h3 className="instructions-title">How This Time Machine Works:</h3>
              <div className="instructions-content">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Choose Your Date:</strong> Select any month and day from history. This will be your destination in time - the exact moment you'll experience through your photograph.
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Upload Your Photograph:</strong> Share any image that holds meaning for you. Our AI will transport this image back to your chosen historical date, reimagining how it would appear in that era.
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Add Context (Optional):</strong> Describe any specific historical elements, atmosphere, or details you'd like to see incorporated into your time-traveled image.
                  </div>
                </div>
                <div className="instruction-step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <strong>Begin Your Journey:</strong> Click the time travel button and watch as your modern photograph transforms into a historical scene from your chosen date.
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
              {isLoading ? 'Time Traveling...' : 'Transport Me Back in Time!'}
            </button>
          </div>
        </form>

        {isLoading && <LoadingSpinner />}
        
        {error && <ErrorMessage message={error} />}
        
        {result?.success && result.htmlContent && (
          <div className="result">
            <h3 className="result-title">
              <span className="emoji">✨</span>
              Here's Your Newspaper Frontpage:
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
                {isDownloading ? '📸 Capturing...' : '📥 Download as Image'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App