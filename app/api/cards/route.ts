import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { type Priority } from '@prisma/client'

interface CardUpdateData {
  title?: string
  description?: string
  priority?: Priority
  listId?: number
  order?: number
  dueDate?: Date | null
  estimatedTime?: number | null
  status?: 'active' | 'archived' | 'deleted'
  archivedAt?: Date | null
  deletedAt?: Date | null
}

export async function POST(request: Request) {
  const data = await request.json()
  
  const card = await prisma.card.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'low',
      listId: data.listId,
      order: data.order,
      dueDate: data.dueDate || null,
      estimatedTime: data.estimatedTime || null
    }
  })
  
  return NextResponse.json(card)
}

export async function PUT(request: Request) {
  const data = await request.json()
  
  const updateData: CardUpdateData = {}
  
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.listId !== undefined) updateData.listId = data.listId
  if (data.order !== undefined) updateData.order = data.order
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
  if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime
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

  const card = await prisma.card.update({
    where: { id: data.id },
    data: updateData
  })
  
  return NextResponse.json(card)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return new NextResponse('Missing id', { status: 400 })
  }

  const card = await prisma.card.update({
    where: { id: parseInt(id) },
    data: {
      status: 'deleted',
      deletedAt: new Date(),
      archivedAt: null
    }
  })
  
  return NextResponse.json(card)
}

export async function handleError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return new Response(JSON.stringify({ error: errorMessage }), {
    status: 500,
  })
} 