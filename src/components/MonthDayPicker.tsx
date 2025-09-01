import React, { useState, useEffect } from 'react'

interface MonthDayPickerProps {
  value: string
  onChange: (date: string) => void
}

const MonthDayPicker: React.FC<MonthDayPickerProps> = ({ value, onChange }) => {
  const [month, setMonth] = useState<number>(0)
  const [day, setDay] = useState<number>(0)

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  // Parse initial value
  useEffect(() => {
    if (value && value.includes('/')) {
      const [monthStr, dayStr] = value.split('/')
      const monthNum = parseInt(monthStr, 10)
      const dayNum = parseInt(dayStr, 10)
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        setMonth(monthNum)
        setDay(dayNum)
      }
    }
  }, [value])

  // Get days in selected month
  const getDaysInMonth = (month: number): number => {
    if (month === 0) return 31
    // Use current year for leap year calculation
    const year = new Date().getFullYear()
    return new Date(year, month, 0).getDate()
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10)
    setMonth(newMonth)
    
    // Reset day if current day is invalid for new month
    if (day > getDaysInMonth(newMonth)) {
      setDay(0)
      return
    }
    
    if (newMonth > 0 && day > 0) {
      const formattedDate = `${newMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
      onChange(formattedDate)
    }
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(e.target.value, 10)
    setDay(newDay)
    
    if (month > 0 && newDay > 0) {
      const formattedDate = `${month.toString().padStart(2, '0')}/${newDay.toString().padStart(2, '0')}`
      onChange(formattedDate)
    }
  }

  const daysInMonth = getDaysInMonth(month)
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-group">
      <label className="label">
        Select Date (Month/Day):
      </label>
      
      <div className="date-picker-container">
        <select
          className="date-select"
          value={month}
          onChange={handleMonthChange}
          required
        >
          <option value={0}>Select Month</option>
          {months.map((monthOption) => (
            <option key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </option>
          ))}
        </select>
        
        <select
          className="date-select"
          value={day}
          onChange={handleDayChange}
          disabled={month === 0}
          required
        >
          <option value={0}>Select Day</option>
          {dayOptions.map((dayNum) => (
            <option key={dayNum} value={dayNum}>
              {dayNum}
            </option>
          ))}
        </select>
      </div>
      
      {/* {value && (
        <div className="selected-date">
          Selected: {value}
        </div>
      )} */}
    </div>
  )
}

export default MonthDayPicker