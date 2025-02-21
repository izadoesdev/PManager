import { useState } from 'react'
import { type List as ListType, type Card as CardType } from '@prisma/client'
import { DropResult } from '@hello-pangea/dnd'

export function useBoard(initialLists: ListType[], initialCards: CardType[]) {
  const [lists, setLists] = useState(initialLists)
  const [cards, setCards] = useState(initialCards)
  const [newListTitle, setNewListTitle] = useState('')
  const [showArchivedSheet, setShowArchivedSheet] = useState(false)
  const [showDeletedSheet, setShowDeletedSheet] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [boardTitle, setBoardTitle] = useState('Project Board')
  const [itemToDelete, setItemToDelete] = useState<{ type: 'list' | 'card'; id: number } | null>(null)

  const activeLists = lists
    .filter(list => list.status === 'active')
    .sort((a, b) => a.order - b.order)
  const archivedLists = lists.filter(list => list.status === 'archived')
  const deletedLists = lists.filter(list => list.status === 'deleted')
  const archivedCards = cards.filter(card => card.status === 'archived')
  const deletedCards = cards.filter(card => card.status === 'deleted')

  const addList = async () => {
    if (!newListTitle.trim()) return
    
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newListTitle,
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

  const permanentlyDeleteCard = async (cardId: number) => {
    const response = await fetch(`/api/cards/${cardId}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      setCards(cards.filter(card => card.id !== cardId))
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return

    // Handle list reordering
    if (type === 'list') {
      
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

  return {
    lists,
    cards,
    setCards,
    newListTitle,
    setNewListTitle,
    showArchivedSheet,
    setShowArchivedSheet,
    showDeletedSheet,
    setShowDeletedSheet,
    isEditingTitle,
    setIsEditingTitle,
    boardTitle,
    setBoardTitle,
    itemToDelete,
    setItemToDelete,
    activeLists,
    archivedLists,
    deletedLists,
    archivedCards,
    deletedCards,
    addList,
    updateList,
    archiveList,
    deleteList,
    permanentlyDeleteList,
    archiveCard,
    deleteCard,
    permanentlyDeleteCard,
    onDragEnd,
  }
} 