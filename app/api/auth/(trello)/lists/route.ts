import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

interface ListUpdateData {
  title?: string
  order?: number
  status?: 'active' | 'archived' | 'deleted'
  archivedAt?: Date | null
  deletedAt?: Date | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return new NextResponse('Board ID is required', { status: 400 })
    }

    const lists = await prisma.list.findMany({
      where: { boardId: parseInt(boardId) },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(lists)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error:', errorMessage)
    return new NextResponse('Error fetching lists', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const list = await prisma.list.create({
      data: {
        title: data.title,
        boardId: data.boardId,
        order: data.order
      }
    })
    
    return NextResponse.json(list)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error:', errorMessage)
    return new NextResponse('Error creating list', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    const updateData: ListUpdateData = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.order !== undefined) updateData.order = data.order
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'archived') {
        updateData.archivedAt = new Date()
        updateData.deletedAt = null
      } else if (data.status === 'deleted') {
        updateData.deletedAt = new Date()
        updateData.archivedAt = null
      } else {
        updateData.archivedAt = null
        updateData.deletedAt = null
      }
    }

    const list = await prisma.list.update({
      where: { id: data.id },
      data: updateData
    })
    
    return NextResponse.json(list)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error:', errorMessage)
    return new NextResponse('Error updating list', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return new NextResponse('Missing id', { status: 400 })
  }

  // Update all cards in the list to be deleted
  await prisma.card.updateMany({
    where: { listId: parseInt(id) },
    data: {
      status: 'deleted',
      deletedAt: new Date(),
      archivedAt: null
    }
  })

  // Update the list to be deleted
  const list = await prisma.list.update({
    where: { id: parseInt(id) },
    data: {
      status: 'deleted',
      deletedAt: new Date(),
      archivedAt: null
    }
  })
  
  return NextResponse.json(list)
} 