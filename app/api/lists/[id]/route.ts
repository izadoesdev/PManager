import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

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

    return NextResponse.json({ message: 'List deleted successfully' }, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
} 