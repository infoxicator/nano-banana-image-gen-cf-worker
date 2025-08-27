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
        Describe what you want to create:
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={handleChange}
        placeholder="Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation"
        className="prompt-textarea"
        rows={4}
        required
      />
      <div className="character-count">
        {value.length} characters
      </div>
    </div>
  )
}

export default PromptInput