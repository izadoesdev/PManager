import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(request: Request) {
  try {
    const id = parseInt(request.url.split('/lists/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid list ID' },
        { status: 400 }
      )
    }

    // First delete all cards in the list
    await prisma.card.deleteMany({
      where: { listId: id }
    })

    // Then delete the list
    await prisma.list.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting list:', error)
    return new NextResponse('Error deleting list', { status: 500 })
  }
} 