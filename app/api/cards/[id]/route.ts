import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const {id} = await params

    await prisma.card.delete({
      where: { id: parseInt(id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting card:', error)
    return new NextResponse('Error deleting card', { status: 500 })
  }
} 