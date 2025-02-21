'use client'

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Clock } from "lucide-react"

interface EstimatedTimeProps {
  value: number | null // in minutes
  onChange: (minutes: number | null) => void
}

const TIME_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: '1d', minutes: 480 }, // 8-hour workday
  { label: '3d', minutes: 1440 }, // 3 workdays
  { label: '1w', minutes: 2400 }, // 5 workdays
]

export function EstimatedTime({ value, onChange }: EstimatedTimeProps) {
  const formatTime = (minutes: number | null) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    if (minutes < 480) return `${minutes / 60}h`
    return `${Math.round(minutes / 480)}d`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Clock className="h-4 w-4 mr-2" />
          {value ? formatTime(value) : 'Estimate'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-2">
          {TIME_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              variant={value === preset.minutes ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange(preset.minutes)}
            >
              {preset.label}
            </Button>
          ))}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => onChange(null)}
            >
              Clear estimate
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 