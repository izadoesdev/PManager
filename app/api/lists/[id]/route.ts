import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // First delete all cards in the list
    await prisma.card.deleteMany({
      where: { listId: parseInt(id) }
    })

    // Then delete the list
    await prisma.list.delete({
      where: { id: parseInt(id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting list:', error)
    return new NextResponse('Error deleting list', { status: 500 })
  }
} 