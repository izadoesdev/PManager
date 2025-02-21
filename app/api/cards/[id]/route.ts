import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

export async function DELETE(request: Request) {
  try {
    const id = parseInt(request.url.split('/cards/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid card ID' },
        { status: 400 }
      )
    }

    await prisma.card.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Card deleted successfully' }, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
} 