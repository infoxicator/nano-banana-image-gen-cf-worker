import React from 'react'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="form-group">
      <label htmlFor="prompt" className="label">
        Additional context (optional):
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={handleChange}
        placeholder="Describe any specific details you'd like to see in your historical journey..."
        className="prompt-textarea"
        rows={3}
      />
      <div className="character-count">
        {value.length} characters
      </div>
    </div>
  )
}

export default PromptInput