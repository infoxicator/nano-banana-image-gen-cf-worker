import React, { useRef, useState } from 'react'
import { useLanguage } from '../i18n'

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, selectedFile }) => {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleSelection = (file: File | null) => {
    onFileSelect(file)

    if (!file) {
      setStatusMessage(null)
      setUploadError(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage(null)
      setUploadError(t.imageUploadError)
      return
    }

    setStatusMessage(t.imageUploadSuccess)
    setUploadError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleSelection(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith('image/')) {
      handleSelection(file)
      if (fileInputRef.current) {
        const dt = new DataTransfer()
        dt.items.add(file)
        fileInputRef.current.files = dt.files
      }
    } else if (!file) {
      handleSelection(null)
    } else {
      setStatusMessage(null)
      setUploadError(t.imageUploadError)
    }
  }

  return (
    <div className="form-group">
      <label htmlFor="imageFile" className="label">
        {t.imageUploadLabel}
      </label>
      
      <div 
        className="file-drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="imageFile"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
          required
        />
        
        <div className="file-drop-content">
          <div className="file-icon">📁</div>
          <p>
            {selectedFile 
              ? `${t.imageSelected}: ${selectedFile.name}` 
              : t.imageUploadInstruction
            }
          </p>
          {uploadError && <div className="upload-error">❌ {uploadError}</div>}
          {statusMessage && !uploadError && <div className="upload-success">✅ {statusMessage}</div>}
        </div>
      </div>
      
      {selectedFile && (
        <div className="image-preview">
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="Preview" 
            className="preview-image"
          />
        </div>
      )}
    </div>
  )
}

export default ImageUpload
