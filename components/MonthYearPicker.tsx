'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MonthYearPickerProps {
  value?: string // Expected format: "YYYY-MM" or "Month YYYY"
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export default function MonthYearPicker({
  value,
  onChange,
  label,
  placeholder = 'Select month and year',
  disabled = false,
  className = ''
}: MonthYearPickerProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Generate years (from 1990 to current year + 2)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i + 2)

  // Parse the initial value
  useEffect(() => {
    if (value) {
      // Try to parse different formats
      if (value.includes('-')) {
        // Format: "YYYY-MM"
        const [year, month] = value.split('-')
        setSelectedYear(year)
        setSelectedMonth(month)
      } else {
        // Format: "Month YYYY" or other formats
        const parts = value.split(' ')
        
        if (parts.length >= 2) {
          const monthName = parts[0]
          const year = parts[parts.length - 1]
          
          const monthObj = MONTHS.find(m => 
            m.label.toLowerCase() === monthName.toLowerCase()
          )
          
          if (monthObj && year.match(/^\d{4}$/)) {
            setSelectedMonth(monthObj.value)
            setSelectedYear(year)
          }
        }
      }
    } else {
      setSelectedMonth('')
      setSelectedYear('')
    }
  }, [value])

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    if (selectedYear) {
      const monthLabel = MONTHS.find(m => m.value === month)?.label
      if (monthLabel) {
        onChange(`${monthLabel} ${selectedYear}`)
      }
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    if (selectedMonth) {
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label
      if (monthLabel) {
        onChange(`${monthLabel} ${year}`)
      }
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        {/* Month Selector */}
        <div>
          <Label htmlFor="month-select" className="text-xs text-muted-foreground">
            Month
          </Label>
          <Select 
            value={selectedMonth} 
            onValueChange={handleMonthChange}
            disabled={disabled}
          >
            <SelectTrigger id="month-select">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selector */}
        <div>
          <Label htmlFor="year-select" className="text-xs text-muted-foreground">
            Year
          </Label>
          <Select 
            value={selectedYear} 
            onValueChange={handleYearChange}
            disabled={disabled}
          >
            <SelectTrigger id="year-select">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedMonth && !selectedYear && placeholder && (
        <p className="text-xs text-muted-foreground">{placeholder}</p>
      )}
    </div>
  )
}
