'use client'

import { useState } from 'react'
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd'
import { List } from './List'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Plus, Archive, Pencil, Check, Trash2, FileDown, X, RotateCcw, ArrowLeft, Save } from "lucide-react"
import { type List as ListType, type Card as CardType, type Board as BoardType } from '@prisma/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'
import { SaveTemplateDialog } from './SaveTemplateDialog'

dayjs.extend(relativeTime)

interface BoardProps {
  board: BoardType
  initialLists: ListType[]
  initialCards: CardType[]
}

export default function Board({ board, initialLists, initialCards }: BoardProps) {
  const [lists, setLists] = useState(initialLists)
  const [cards, setCards] = useState(initialCards)
  const [newListTitle, setNewListTitle] = useState('')
  const [showArchivedSheet, setShowArchivedSheet] = useState(false)
  const [showDeletedSheet, setShowDeletedSheet] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [boardTitle, setBoardTitle] = useState(board.title)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'list' | 'card'; id: number } | null>(null)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return

    // Handle list reordering
    if (type === 'list') {
      const listId = parseInt(draggableId.replace('list-', ''))
      
      // Only work with active lists for reordering
      const activeNewLists = Array.from(lists)
        .filter(list => list.status === 'active')
        .sort((a, b) => a.order - b.order)
      
      const [removed] = activeNewLists.splice(source.index, 1)
      activeNewLists.splice(destination.index, 0, removed)

      // Calculate new orders for active lists
      const updatedActiveLists = activeNewLists.map((list, index) => ({
        ...list,
        order: index * 1000
      }))

      // Merge updated active lists with non-active lists
      const updatedLists = lists.map(list => {
        const updatedList = updatedActiveLists.find(l => l.id === list.id)
        return updatedList || list
      })

      // Update state immediately
      setLists(updatedLists)

      try {
        // Update the database
        await Promise.all(
          updatedActiveLists.map(list =>
            fetch('/api/lists', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: list.id,
                order: list.order
              })
            })
          )
        )
      } catch (error) {
        console.error('Failed to update list order:', error)
        // On error, revert to original state
        setLists(lists)
      }
      return
    }

    // Handle card reordering
    const sourceList = lists.find(list => list.id === parseInt(source.droppableId))
    const destList = lists.find(list => list.id === parseInt(destination.droppableId))

    if (!sourceList || !destList) return

    if (source.droppableId === destination.droppableId) {
      const listCards = cards.filter(card => card.listId === sourceList.id)
      const newCards = Array.from(listCards)
      const [removed] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, removed)

      const updatedCards = cards.map(card => {
        const updatedCard = newCards.find(c => c.id === card.id)
        return updatedCard || card
      })
      setCards(updatedCards)

      await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(draggableId),
          order: destination.index
        })
      })
    } else {
      const sourceCards = cards.filter(card => card.listId === sourceList.id)
      const destCards = cards.filter(card => card.listId === destList.id)
      
      const newSourceCards = Array.from(sourceCards)
      const [removed] = newSourceCards.splice(source.index, 1)
      const newDestCards = Array.from(destCards)
      newDestCards.splice(destination.index, 0, { ...removed, listId: destList.id })

      const updatedCards = cards.map(card => {
        if (card.id === parseInt(draggableId)) {
          return { ...card, listId: destList.id }
        }
        return card
      })    
      setCards(updatedCards)

      await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(draggableId),
          listId: destList.id,
          order: destination.index
        })
      })
    }
  }

  const addList = async () => {
    if (!newListTitle.trim()) return
    
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newListTitle,
        boardId: board.id,
        order: lists.length
      })
    })
    
    const newList = await response.json()
    setLists([...lists, newList])
    setNewListTitle('')
  }

  const updateList = async (listId: number, title: string) => {
    const response = await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: listId,
        title
      })
    })
    
    const updatedList = await response.json()
    setLists(lists.map(list => list.id === listId ? updatedList : list))
  }

  const archiveList = async (listId: number) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return

    const newStatus = list.status === 'archived' ? 'active' : 'archived'
    const response = await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: listId,
        status: newStatus,
        archivedAt: newStatus === 'archived' ? new Date() : null
      })
    })
    
    const updatedList = await response.json()
    setLists(lists.map(list => list.id === listId ? updatedList : list))
  }

  const deleteList = async (listId: number) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return

    const newStatus = list.status === 'deleted' ? 'active' : 'deleted'
    const response = await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: listId,
        status: newStatus,
        deletedAt: newStatus === 'deleted' ? new Date() : null
      })
    })
    
    if (response.ok) {
      const updatedList = await response.json()
      setLists(lists.map(list => list.id === listId ? updatedList : list))
    }
  }

  const archiveCard = async (cardId: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const newStatus = card.status === 'archived' ? 'active' : 'archived'
    const response = await fetch('/api/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cardId,
        status: newStatus,
        archivedAt: newStatus === 'archived' ? new Date() : null
      })
    })
    
    const updatedCard = await response.json()
    setCards(cards.map(card => card.id === cardId ? updatedCard : card))
  }

  const deleteCard = async (cardId: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const newStatus = card.status === 'deleted' ? 'active' : 'deleted'
    const response = await fetch('/api/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cardId,
        status: newStatus,
        deletedAt: newStatus === 'deleted' ? new Date() : null
      })
    })
    
    const updatedCard = await response.json()
    setCards(cards.map(card => card.id === cardId ? updatedCard : card))
  }

  const permanentlyDeleteList = async (listId: number) => {
    const response = await fetch(`/api/lists/${listId}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      setLists(lists.filter(list => list.id !== listId))
      // Also remove all cards in this list
      setCards(cards.filter(card => card.listId !== listId))
    }
  }

  const permanentlyDeleteCard = async (cardId: number) => {
    const response = await fetch(`/api/cards/${cardId}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      setCards(cards.filter(card => card.id !== cardId))
    }
  }

  const activeLists = lists
    .filter(list => list.status === 'active')
    .sort((a, b) => a.order - b.order)
  const archivedLists = lists.filter(list => list.status === 'archived')
  const deletedLists = lists.filter(list => list.status === 'deleted')
  const archivedCards = cards.filter(card => card.status === 'archived')
  const deletedCards = cards.filter(card => card.status === 'deleted')

  const exportBoard = () => {
    const formatCard = (card: CardType) => {
      return `  - ${card.title} (${card.priority})${card.description ? `\n    ${card.description.split('\n').join('\n    ')}` : ''}`
    }

    const formatList = (list: ListType, cards: CardType[]) => {
      const listCards = cards
        .filter(card => card.listId === list.id && card.status === 'active')
        .sort((a, b) => a.order - b.order)
      
      return `${list.title} (${listCards.length} cards)${list.status !== 'active' ? ` - ${list.status.toUpperCase()}` : ''}
${listCards.map(formatCard).join('\n')}`
    }

    const activeSection = activeLists.length > 0 ? 
      `Active Lists:\n${activeLists.map(list => formatList(list, cards)).join('\n\n')}\n` : ''
    
    const archivedSection = archivedLists.length > 0 ? 
      `\nArchived Lists:\n${archivedLists.map(list => formatList(list, cards)).join('\n\n')}\n` : ''
    
    const summary = `Board: ${boardTitle}
Last exported: ${dayjs().format('MMM D, YYYY h:mm A')} - Coded by Issa :)

${activeSection}${archivedSection}`.trim()

    navigator.clipboard.writeText(summary)
  }

  const updateBoardTitle = async () => {
    if (!boardTitle.trim() || boardTitle === board.title) {
      setBoardTitle(board.title)
      setIsEditingTitle(false)
      return
    }

    const response = await fetch('/api/boards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: board.id,
        title: boardTitle
      })
    })
    
    if (response.ok) {
      setIsEditingTitle(false)
    } else {
      // If update fails, revert to original title
      setBoardTitle(board.title)
      setIsEditingTitle(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-card px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {isEditingTitle ? (
            <div className="flex gap-2 items-center">
              <Input
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateBoardTitle()}
                className="bg-muted/50 h-8 text-lg font-semibold"
              />
              <Button size="icon" variant="ghost" onClick={updateBoardTitle}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold select-none">{boardTitle}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-50 hover:opacity-100"
                onClick={() => setIsEditingTitle(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              onClick={() => setShowArchivedSheet(true)}
            >
              <Archive className="h-4 w-4" />
              Archived
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              onClick={() => setShowDeletedSheet(true)}
            >
              <Trash2 className="h-4 w-4" />
              Deleted
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              onClick={exportBoard}
            >
              <FileDown className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              onClick={() => setShowSaveTemplateDialog(true)}
            >
              <Save className="h-4 w-4" />
              Save as Template
            </Button>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-80">
          <Input
            placeholder="Add new list"
            value={newListTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListTitle(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && addList()}
            className="bg-muted/50"
          />
          <Button onClick={addList} size="icon" variant="secondary" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4 lg:p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="lists" direction="horizontal" type="list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 lg:gap-6 min-h-full min-w-fit"
              >
                {activeLists.map((list, index) => (
                  <List
                    key={list.id}
                    list={list}
                    cards={cards.filter(card => card.listId === list.id && card.status === 'active')}
                    index={index}
                    setCards={setCards}
                    onUpdateList={updateList}
                    onArchive={archiveList}
                    onDelete={deleteList}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>

      {/* Archived Sheet */}
      <Sheet open={showArchivedSheet} onOpenChange={setShowArchivedSheet}>
        <SheetContent side="right" className="w-[95vw] max-w-[1200px] sm:w-[800px] p-0">
          <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Items
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-accent">
            <div className="p-6 space-y-8">
              {/* Archived Lists */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived Lists ({archivedLists.length})
                </h3>
                <div className="grid gap-4">
                  {archivedLists.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                      No archived lists
                    </div>
                  ) : (
                    archivedLists.map(list => (
                      <div key={list.id} className="bg-muted/50 rounded-lg p-4 group hover:bg-muted/70 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{list.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Archived {dayjs(list.archivedAt).format('MMM D, YYYY h:mm A')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => archiveList(list.id)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Unarchive
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Archived Cards */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived Cards ({archivedCards.length})
                </h3>
                <div className="grid gap-4">
                  {archivedCards.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                      No archived cards
                    </div>
                  ) : (
                    archivedCards.map(card => {
                      const list = lists.find(l => l.id === card.listId)
                      return (
                        <div key={card.id} className="bg-muted/50 rounded-lg p-4 group hover:bg-muted/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{card.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                From list: {list?.title || 'Unknown'} • Archived {dayjs(card.archivedAt).format('MMM D, YYYY h:mm A')}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => archiveCard(card.id)}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Unarchive
                            </Button>
                          </div>
                          {card.description && (
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{card.description}</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deleted Sheet */}
      <Sheet open={showDeletedSheet} onOpenChange={setShowDeletedSheet}>
        <SheetContent side="right" className="w-[95vw] max-w-[1200px] sm:w-[800px] p-0">
          <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Deleted Items
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-accent">
            <div className="p-6 space-y-8">
              {/* Deleted Lists */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Deleted Lists ({deletedLists.length})
                </h3>
                <div className="grid gap-4">
                  {deletedLists.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                      No deleted lists
                    </div>
                  ) : (
                    deletedLists.map(list => (
                      <div key={list.id} className="bg-muted/50 rounded-lg p-4 group hover:bg-muted/70 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{list.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Deleted {dayjs(list.deletedAt).format('MMM D, YYYY h:mm A')}
                            </p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteList(list.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setItemToDelete({ type: 'list', id: list.id })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Deleted Cards */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Deleted Cards ({deletedCards.length})
                </h3>
                <div className="grid gap-4">
                  {deletedCards.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                      No deleted cards
                    </div>
                  ) : (
                    deletedCards.map(card => {
                      const list = lists.find(l => l.id === card.listId)
                      return (
                        <div key={card.id} className="bg-muted/50 rounded-lg p-4 group hover:bg-muted/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{card.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                From list: {list?.title || 'Unknown'} • Deleted {dayjs(card.deletedAt).format('MMM D, YYYY h:mm A')}
                              </p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCard(card.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setItemToDelete({ type: 'card', id: card.id })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Forever
                              </Button>
                            </div>
                          </div>
                          {card.description && (
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{card.description}</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={itemToDelete !== null} 
        onOpenChange={(open: boolean) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete {itemToDelete?.type} permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} and remove it from our servers.
              {itemToDelete?.type === 'list' && ' All cards in this list will also be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (itemToDelete?.type === 'list') {
                  permanentlyDeleteList(itemToDelete.id)
                } else if (itemToDelete?.type === 'card') {
                  permanentlyDeleteCard(itemToDelete.id)
                }
                setItemToDelete(null)
              }}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        boardId={board.id}
        boardTitle={boardTitle}
        boardDescription={board.description}
      />
    </div>
  )
} 