import { prisma } from '@/app/lib/db'
import { notFound } from 'next/navigation'
import Board from '@/app/components/Board'
import Link from 'next/link'

interface BoardPageProps {
  params: {
    id: string
  }
}

async function getData(boardId: number) {
  try {
    const [board, lists, cards] = await Promise.all([
      prisma.board.findUnique({
        where: { id: boardId }
      }),
      prisma.list.findMany({
        where: { boardId },
        orderBy: { order: 'asc' }
      }),
      prisma.card.findMany({
        where: { list: { boardId } },
        orderBy: { order: 'asc' }
      })
    ])

    if (!board || board.status !== 'active') {
      return null
    }

    return {
      board,
      lists,
      cards
    }
  } catch (error) {
    console.error('Error fetching board data:', error)
    return null
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params
  const data = await getData(parseInt(id))

  if (!data) {
    notFound()
  }

  return (
    <main className="h-screen">
      <Board
        board={data.board}
        initialLists={data.lists}
        initialCards={data.cards}
      />
    </main>
  )
} 