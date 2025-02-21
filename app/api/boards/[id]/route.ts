import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

export async function DELETE(request: Request) {
  try {
    const id = parseInt(request.url.split('/boards/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid board ID' },
        { status: 400 }
      )
    }

    // First delete all cards in all lists of the board
    await prisma.card.deleteMany({
      where: { list: { boardId: id } }
    })

    // Then delete all lists in the board
    await prisma.list.deleteMany({
      where: { boardId: id }
    })

    // Finally delete the board
    await prisma.board.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Board deleted successfully' }, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
} 