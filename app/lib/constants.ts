import { type Priority } from '@prisma/client'

export const PRIORITY_COLORS: Record<Priority, {
  bg: string
  text: string
  hover: string
}> = {
  low: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    hover: 'hover:bg-blue-500/20'
  },
  medium: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    hover: 'hover:bg-yellow-500/20'
  },
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    hover: 'hover:bg-red-500/20'
  }
}

export const DATE_FORMATS = {
  FULL: 'MMM D, YYYY h:mm A',
  SHORT: 'MMM D, YYYY'
} as const

export const DRAG_TYPES = {
  LIST: 'list',
  CARD: 'card'
} as const

export const DEFAULT_BOARD_TITLE = 'Project Board'

export const LIST_WIDTH = 320 // 80 * 4 (w-80) 