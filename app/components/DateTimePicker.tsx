'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar, Clock } from "lucide-react"
import dayjs from 'dayjs'

interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = useState<string>(value ? dayjs(value).format('YYYY-MM-DD') : '')
  const [time, setTime] = useState<string>(value ? dayjs(value).format('HH:mm') : '')

  useEffect(() => {
    if (value) {
      setDate(dayjs(value).format('YYYY-MM-DD'))
      setTime(dayjs(value).format('HH:mm'))
    } else {
      setDate('')
      setTime('')
    }
  }, [value])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    if (e.target.value && time) {
      const newDate = dayjs(`${e.target.value} ${time}`).toDate()
      onChange(newDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value)
    if (date && e.target.value) {
      const newDate = dayjs(`${date} ${e.target.value}`).toDate()
      onChange(newDate)
    }
  }

  const clearDateTime = () => {
    setDate('')
    setTime('')
    onChange(null)
  }

  const quickSetTime = (hours: number) => {
    const newDate = dayjs().add(hours, 'hour').toDate()
    setDate(dayjs(newDate).format('YYYY-MM-DD'))
    setTime(dayjs(newDate).format('HH:mm'))
    onChange(newDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Calendar className="h-4 w-4 mr-2" />
          {value ? (
            dayjs(value).format('MMM D, YYYY h:mm A')
          ) : (
            'Set due date'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date</span>
            </div>
            <Input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Quick set</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => quickSetTime(1)}>+1h</Button>
              <Button size="sm" variant="outline" onClick={() => quickSetTime(4)}>+4h</Button>
              <Button size="sm" variant="outline" onClick={() => quickSetTime(24)}>+1d</Button>
              <Button size="sm" variant="outline" onClick={() => quickSetTime(72)}>+3d</Button>
              <Button size="sm" variant="outline" onClick={() => quickSetTime(168)}>+1w</Button>
            </div>
          </div>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={clearDateTime}
            >
              Clear date
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 