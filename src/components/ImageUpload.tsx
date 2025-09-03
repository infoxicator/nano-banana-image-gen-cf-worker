import React, { useRef, useState } from 'react'

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void
  onImageUploaded: (imageUrl: string) => void
  selectedFile: File | null
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, onImageUploaded, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)
    setUploadedImageUrl(null)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const data = await response.json() as { imageUrl: string; success: boolean }
      setUploadedImageUrl(data.imageUrl)
      onImageUploaded(data.imageUrl)
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFileSelect(file)
    if (file) {
      uploadFile(file)
    } else {
      setUploadedImageUrl(null)
      setUploadError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
      uploadFile(file)
      if (fileInputRef.current) {
        const dt = new DataTransfer()
        dt.items.add(file)
        fileInputRef.current.files = dt.files
      }
    }
  }

  return (
    <div className="form-group">
      <label htmlFor="imageFile" className="label">
        Upload an image:
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
            {isUploading 
              ? 'Uploading...'
              : selectedFile 
                ? `Selected: ${selectedFile.name}` 
                : 'Click to select or drag and drop an image'
            }
          </p>
          {isUploading && <div className="upload-progress">⏳ Uploading to cloud...</div>}
          {uploadError && <div className="upload-error">❌ {uploadError}</div>}
          {uploadedImageUrl && <div className="upload-success">✅ Image uploaded successfully!</div>}
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