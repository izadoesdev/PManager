import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting card:', error)
    return new NextResponse('Error deleting card', { status: 500 })
  }
} 