import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    // First delete all cards in all lists of the board
    await prisma.card.deleteMany({
      where: { list: { boardId: parseInt(id) } }
    })

    // Then delete all lists in the board
    await prisma.list.deleteMany({
      where: { boardId: parseInt(id) }
    })

    // Finally delete the board
    await prisma.board.delete({
      where: { id: parseInt(id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting board:', error)
    return new NextResponse('Error deleting board', { status: 500 })
  }
} 