import { type List as PrismaList, type Card as PrismaCard, type Board as PrismaBoard } from '@prisma/client'

export type List = PrismaList
export type Card = PrismaCard

export interface BoardWithCounts extends PrismaBoard {
  counts?: {
    lists: number
    cards: number
  }
}

export type ItemToDelete = {
  type: 'list' | 'card'
  id: number
} | null

export type DragItem = {
  id: number
  type: 'list' | 'card'
  index: number
  listId?: number
}

export type CardUpdateData = Partial<Omit<Card, 'id' | 'createdAt'>>
export type ListUpdateData = Partial<Omit<List, 'id' | 'createdAt'>>

export type BoardState = {
  lists: List[]
  cards: Card[]
  activeLists: List[]
  archivedLists: List[]
  deletedLists: List[]
  archivedCards: Card[]
  deletedCards: Card[]
} 