import { prisma } from '@/app/lib/db'
import { notFound } from 'next/navigation'
import Board from '@/app/components/Board'

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
export default async function BoardPage( { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const boardId = parseInt(id)
  const data = await getData(boardId)

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