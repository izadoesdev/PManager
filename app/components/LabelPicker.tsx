'use client'

import { useState, useEffect } from 'react'
import { Label } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tag, Plus, X, Check } from "lucide-react"

interface LabelPickerProps {
  boardId: number
  selectedLabels: Label[]
  onLabelsChange: (labels: Label[]) => void
}

const PRESET_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

export function LabelPicker({ boardId, selectedLabels, onLabelsChange }: LabelPickerProps) {
  const [labels, setLabels] = useState<Label[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value)

  useEffect(() => {
    fetchLabels()
  }, [boardId])

  const fetchLabels = async () => {
    const response = await fetch(`/api/boards/${boardId}/labels`)
    if (response.ok) {
      const data = await response.json()
      setLabels(data)
    }
  }

  const createLabel = async () => {
    if (!newLabelName.trim()) return

    const response = await fetch(`/api/boards/${boardId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newLabelName,
        color: selectedColor
      })
    })

    if (response.ok) {
      const newLabel = await response.json()
      setLabels([...labels, newLabel])
      setNewLabelName('')
      setIsCreating(false)
      setSelectedColor(PRESET_COLORS[0].value)
    }
  }

  const deleteLabel = async (labelId: number) => {
    const response = await fetch(`/api/boards/${boardId}/labels?labelId=${labelId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setLabels(labels.filter(label => label.id !== labelId))
      onLabelsChange(selectedLabels.filter(label => label.id !== labelId))
    }
  }

  const toggleLabel = (label: Label) => {
    const isSelected = selectedLabels.some(l => l.id === label.id)
    if (isSelected) {
      onLabelsChange(selectedLabels.filter(l => l.id !== label.id))
    } else {
      onLabelsChange([...selectedLabels, label])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Tag className="h-4 w-4 mr-2" />
          Labels
          {selectedLabels.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
              {selectedLabels.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-4">
          {/* Existing Labels */}
          <div className="space-y-2">
            {labels.map(label => (
              <div
                key={label.id}
                className="flex items-center gap-2"
                style={{ '--label-color': label.color } as any}
              >
                <button
                  onClick={() => toggleLabel(label)}
                  className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-muted"
                >
                  <span
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-sm">{label.name}</span>
                  {selectedLabels.some(l => l.id === label.id) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => deleteLabel(label.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Create New Label */}
          {isCreating ? (
            <div className="space-y-3">
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="h-8"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded ${selectedColor === color.value ? 'ring-2 ring-offset-2' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={createLabel}
                  disabled={!newLabelName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Label
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 