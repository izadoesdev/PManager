'use client'

import { useState, useRef, useEffect } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Card } from './Card'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, X, Check, Archive, Trash2, Clock } from "lucide-react"
import { type List as ListType, type Card as CardType } from '@prisma/client'
import dayjs from 'dayjs'

interface ListProps {
  list: ListType
  cards: CardType[]
  index: number
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>
  onUpdateList: (listId: number, title: string) => Promise<void>
  onArchive?: (listId: number) => Promise<void>
  onDelete?: (listId: number) => Promise<void>
}

const priorityColors = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
} as const

export function List({ list, cards, index, setCards, onUpdateList, onArchive, onDelete }: ListProps) {
  const [newCardTitle, setNewCardTitle] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const priorityCounts = {
    low: cards.filter(card => card.priority === 'low').length,
    medium: cards.filter(card => card.priority === 'medium').length,
    high: cards.filter(card => card.priority === 'high').length
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const addCard = async () => {
    if (!newCardTitle.trim()) return

    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newCardTitle,
        description: null,
        listId: list.id,
        order: cards.length
      })
    })

    const newCard = await response.json()
    setCards(prevCards => [...prevCards, newCard])
    setNewCardTitle('')
  }

  const handleTitleSubmit = async () => {
    if (editTitle.trim() && editTitle !== list.title) {
      await onUpdateList(list.id, editTitle)
    } else {
      setEditTitle(list.title)
    }
    setIsEditing(false)
  }

  const handleCardUpdate = async (cardId: number, data: Partial<CardType>) => {
    const response = await fetch('/api/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, ...data })
    })

    const updatedCard = await response.json()
    setCards(prevCards => prevCards.map(card => 
      card.id === cardId ? updatedCard : card
    ))
  }

  const handleCardDelete = async (cardId: number) => {
    const response = await fetch(`/api/cards?id=${cardId}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      setCards(prevCards => prevCards.filter(card => card.id !== cardId))
    }
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-80 shrink-0 group ${list.status !== 'active' ? 'opacity-50' : ''}`}
        >
          <div className="bg-accent/50 rounded-lg p-3 flex flex-col max-h-[calc(100vh-8rem)]">
            <div 
              {...provided.dragHandleProps}
              className="flex items-start justify-between gap-2 mb-2"
            >
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <Input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    className="bg-background/50"
                    placeholder="List title"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleTitleSubmit}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm select-none">{list.title}</h3>
                      <span className="text-xs text-muted-foreground">({cards.length})</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className={priorityColors.low}>{priorityCounts.low} low</span>
                      <span className={priorityColors.medium}>{priorityCounts.medium} medium</span>
                      <span className={priorityColors.high}>{priorityCounts.high} high</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {onArchive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onArchive(list.id)}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => onDelete(list.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
            {list.status !== 'active' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Clock className="h-3 w-3" />
                <span>
                  {list.status === 'archived' ? 'Archived' : 'Deleted'}{' '}
                  {dayjs(list.status === 'archived' ? list.archivedAt : list.deletedAt).format('MMM D, YYYY')}
                </span>
              </div>
            )}
            <Droppable droppableId={list.id.toString()} type="card">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 gap-4 pb-4 overflow-y-auto min-h-[64px] flex-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-accent"
                >
                  {cards
                    .filter(card => card.listId === list.id)
                    .map((card, index) => (
                      <Card
                        key={card.id}
                        card={card}
                        index={index}
                        boardId={list.boardId}
                        onUpdate={handleCardUpdate}
                        onDelete={handleCardDelete}
                      />
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="mt-2 space-y-2 pt-2 border-t border-border/50">
              <Input
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCard()}
                className="bg-background/50"
                placeholder="Add a new card..."
              />
              <Button 
                onClick={addCard} 
                variant="secondary" 
                size="sm" 
                className="w-full flex items-center justify-center gap-1"
                disabled={!newCardTitle.trim()}
              >
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
} 