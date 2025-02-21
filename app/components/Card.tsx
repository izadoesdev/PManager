'use client'

import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Card as CardUI } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, X, Check, Archive, Trash2, Clock, Calendar, RotateCcw, Copy, Timer } from "lucide-react"
import { type Card as CardType, type Label } from '@prisma/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CardModal } from './CardModal'
import { DateTimePicker } from './DateTimePicker'
import { EstimatedTime } from './EstimatedTime'
import { LabelPicker } from './LabelPicker'

dayjs.extend(relativeTime)

type Priority = 'low' | 'medium' | 'high'

interface CardProps {
  card: CardType
  index: number
  boardId: number
  onUpdate?: (cardId: number, data: Partial<CardType>) => Promise<void>
  onDelete?: (cardId: number) => Promise<void>
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
}

export function Card({ card, index, boardId, onUpdate, onDelete }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDescription, setEditDescription] = useState(card.description || '')
  const [priority, setPriority] = useState<Priority>(card.priority as Priority)
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    const formattedText = `
Task: ${card.title}
Priority: ${card.priority}
${card.description ? `Description: ${card.description}\n` : ''}
${card.dueDate ? `Due: ${dayjs(card.dueDate).format('MMM D, YYYY h:mm A')}\n` : ''}
${card.estimatedTime ? `Estimated: ${formatEstimatedTime(card.estimatedTime)}\n` : ''}
Created: ${dayjs(card.createdAt).format('MMM D, YYYY h:mm A')}
${card.status !== 'active' ? `${card.status === 'archived' ? 'Archived' : 'Deleted'}: ${dayjs(card.status === 'archived' ? card.archivedAt : card.deletedAt).format('MMM D, YYYY h:mm A')}` : ''}
`.trim()
    
    navigator.clipboard.writeText(formattedText)
  }

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(card.id, {
        title: editTitle,
        description: editDescription || null,
        priority,
        dueDate: card.dueDate,
        estimatedTime: card.estimatedTime
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setEditDescription(card.description || '')
    setPriority(card.priority as Priority)
    setIsEditing(false)
  }

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpdate) {
      await onUpdate(card.id, {
        status: card.status === 'archived' ? 'active' : 'archived',
        archivedAt: card.status === 'archived' ? null : new Date()
      })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      await onDelete(card.id)
    }
  }

  const handleDueDateChange = async (date: Date | null) => {
    if (onUpdate) {
      await onUpdate(card.id, { dueDate: date })
    }
  }

  const handleEstimatedTimeChange = async (minutes: number | null) => {
    if (onUpdate) {
      await onUpdate(card.id, { estimatedTime: minutes })
    }
  }

  const handleLabelsChange = async (labels: Label[]) => {
    setSelectedLabels(labels)
    // Update card labels in the database
  }

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    if (minutes < 480) return `${minutes / 60}h`
    return `${Math.round(minutes / 480)}d`
  }

  return (
    <>
      <Draggable draggableId={card.id.toString()} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="group relative select-none"
            onClick={() => !isEditing && setIsModalOpen(true)}
          >
            <CardUI className={`p-3 hover:bg-accent transition-colors ${card.status !== 'active' ? 'opacity-75' : ''} cursor-pointer`}>
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-background/50"
                    placeholder="Card title"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-background/50 min-h-[80px] resize-none"
                    placeholder="Add a description..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <div className="flex gap-1">
                      {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant="ghost"
                          className={`${priorityColors[p]} ${priority === p ? 'ring-2 ring-offset-1' : ''} capitalize`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPriority(p)
                          }}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <DateTimePicker
                      value={card.dueDate}
                      onChange={handleDueDateChange}
                    />
                    <EstimatedTime
                      value={card.estimatedTime}
                      onChange={handleEstimatedTimeChange}
                    />
                    <LabelPicker
                      boardId={boardId}
                      selectedLabels={selectedLabels}
                      onLabelsChange={handleLabelsChange}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation()
                      handleCancel()
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation()
                      handleSave()
                    }}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{card.title}</h4>
                      {card.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {card.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {card.status === 'active' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsEditing(true)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleArchive}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={handleDelete}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {card.status !== 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={handleArchive}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={copyToClipboard}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityColors[card.priority as Priority]} capitalize`}>
                        {card.priority}
                      </span>
                      {card.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground border-l border-border/50 pl-1.5">
                          <Calendar className="h-3 w-3" />
                          <span title={dayjs(card.dueDate).format('MMM D, YYYY h:mm A')}>
                            {dayjs(card.dueDate).fromNow()}
                          </span>
                        </div>
                      )}
                      {card.estimatedTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground border-l border-border/50 pl-1.5">
                          <Timer className="h-3 w-3" />
                          <span>{formatEstimatedTime(card.estimatedTime)}</span>
                        </div>
                      )}
                    </div>
                    {selectedLabels.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {selectedLabels.map(label => (
                          <span
                            key={label.id}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: label.color + '20', color: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardUI>
          </div>
        )}
      </Draggable>
      <CardModal
        card={card}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
} 