import { type List as ListType, type Card as CardType } from '@prisma/client'
import { type BoardWithCounts } from '@/app/lib/types'

export const api = {
  lists: {
    create: async (title: string, order: number): Promise<ListType> => {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, order })
      })
      return response.json()
    },

    update: async (id: number, data: Partial<ListType>): Promise<ListType> => {
      const response = await fetch('/api/lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })
      return response.json()
    },

    delete: async (id: number): Promise<void> => {
      await fetch(`/api/lists/${id}`, {
        method: 'DELETE'
      })
    },

    updateOrder: async (lists: { id: number; order: number }[]): Promise<void> => {
      await Promise.all(
        lists.map(list =>
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
    }
  },

  cards: {
    create: async (data: {
      title: string
      description: string | null
      listId: number
      order: number
    }): Promise<CardType> => {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return response.json()
    },

    update: async (id: number, data: Partial<CardType>): Promise<CardType> => {
      const response = await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })
      return response.json()
    },

    delete: async (id: number): Promise<void> => {
      await fetch(`/api/cards/${id}`, {
        method: 'DELETE'
      })
    },

    move: async (id: number, listId: number, order: number): Promise<CardType> => {
      const response = await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, listId, order })
      })
      return response.json()
    }
  },

  boards: {
    getAll: async (): Promise<BoardWithCounts[]> => {
      const res = await fetch('/api/boards')
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json()
    },
    
    update: async (id: number, data: Partial<BoardWithCounts>): Promise<BoardWithCounts> => {
      const res = await fetch('/api/boards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })
      if (!res.ok) throw new Error('Failed to update board')
      return res.json()
    },
    
    delete: async (id: number): Promise<boolean> => {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'DELETE'
      })
      return res.ok
    }
  }
} 