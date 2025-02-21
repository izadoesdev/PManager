import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting board:', error)
    return new NextResponse('Error deleting board', { status: 500 })
  }
} 