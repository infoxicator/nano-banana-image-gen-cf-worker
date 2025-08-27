import React, { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import PromptInput from './components/PromptInput'
import GeneratedImage from './components/GeneratedImage'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import './App.css'

interface GenerationResult {
  success: boolean;
  imageData?: string;
  mimeType?: string;
  error?: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !prompt.trim()) {
      setError('Please select an image and enter a prompt.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('prompt', prompt.trim())

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData as string || 'Failed to generate image')
      }

      const data: GenerationResult = await response.json()
      setResult(data)
      
      if (!data.success) {
        setError(data.error || 'Failed to generate image')
      }
    } catch (err) {
      console.error('Error generating image:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">
          <span className="emoji">🎨</span>
          Nano Banana🍌 Image Generator on Cloudflare Workers w/ R2
        </h1>
        
        <form onSubmit={handleSubmit} className="form">
          <ImageUpload 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
          
          <PromptInput 
            value={prompt}
            onChange={handlePromptChange}
          />
          
          <button 
            type="submit" 
            className="generate-btn"
            disabled={isLoading || !selectedFile || !prompt.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {isLoading && <LoadingSpinner />}
        
        {error && <ErrorMessage message={error} />}
        
        {result?.success && result.imageData && (
          <GeneratedImage 
            imageData={result.imageData}
            mimeType={result.mimeType || 'image/png'}
          />
        )}
      </div>
    </div>
  )
}

export default App