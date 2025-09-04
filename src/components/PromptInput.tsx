import React from 'react'
import { useLanguage } from '../i18n'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange }) => {
  const { t } = useLanguage()
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="form-group">
      <label htmlFor="prompt" className="label">
        {t.promptLabel}
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={handleChange}
        placeholder={t.promptPlaceholder}
        className="prompt-textarea"
        rows={3}
      />
      <div className="character-count">
        {value.length} {t.charactersLabel}
      </div>
    </div>
  )
}

export default PromptInput