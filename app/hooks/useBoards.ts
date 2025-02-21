import { useState, useEffect } from 'react'
import { type BoardWithCounts } from '@/app/lib/types'
import { api } from '@/app/lib/api'

export function useBoards() {
  const [boards, setBoards] = useState<BoardWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      setIsLoading(true)
      const data = await api.boards.getAll()
      setBoards(data)
      setError(null)
    } catch (err) {
      setError('Failed to load boards')
      console.error('Error loading boards:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchiveBoard = async (board: BoardWithCounts) => {
    const newStatus = board.status === 'archived' ? 'active' : 'archived'
    try {
      const updatedBoard = await api.boards.update(board.id, {
        status: newStatus,
        archivedAt: newStatus === 'archived' ? new Date() : null
      })
      setBoards(boards.map(b => b.id === board.id ? updatedBoard : b))
    } catch (err) {
      console.error('Error archiving board:', err)
    }
  }

  const handleDeleteBoard = async (board: BoardWithCounts) => {
    const newStatus = board.status === 'deleted' ? 'active' : 'deleted'
    try {
      const updatedBoard = await api.boards.update(board.id, {
        status: newStatus,
        deletedAt: newStatus === 'deleted' ? new Date() : null
      })
      setBoards(boards.map(b => b.id === board.id ? updatedBoard : b))
      return true
    } catch (err) {
      console.error('Error deleting board:', err)
      return false
    }
  }

  const handlePermanentDelete = async (board: BoardWithCounts) => {
    try {
      const success = await api.boards.delete(board.id)
      if (success) {
        setBoards(boards.filter(b => b.id !== board.id))
      }
      return success
    } catch (err) {
      console.error('Error permanently deleting board:', err)
      return false
    }
  }

  const filteredBoards = {
    active: boards.filter(board => board.status === 'active'),
    archived: boards.filter(board => board.status === 'archived'),
    deleted: boards.filter(board => board.status === 'deleted')
  }

  return {
    boards,
    isLoading,
    error,
    filteredBoards,
    handleArchiveBoard,
    handleDeleteBoard,
    handlePermanentDelete,
    refresh: loadBoards
  }
} 