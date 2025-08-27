import React, { useRef } from 'react'

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
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
            {selectedFile 
              ? `Selected: ${selectedFile.name}` 
              : 'Click to select or drag and drop an image'
            }
          </p>
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