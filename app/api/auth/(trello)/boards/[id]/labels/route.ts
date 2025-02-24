import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { z } from 'zod'

// Validation schemas
const labelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
})

// Error handling
const handleError = (error: unknown) => {
  console.error('Label operation error:', error)
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
      { status: 400 }
    )
  }
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
}

export async function GET(request: Request) {
  try {
    const boardId = parseInt(request.url.split('/boards/')[1].split('/')[0])
    if (isNaN(boardId)) {
      return NextResponse.json(
        { error: 'Invalid board ID' },
        { status: 400 }
      )
    }

    const labels = await prisma.label.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(labels)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request) {
  try {
    const boardId = parseInt(request.url.split('/boards/')[1].split('/')[0])
    if (isNaN(boardId)) {
      return NextResponse.json(
        { error: 'Invalid board ID' },
        { status: 400 }
      )
    }

    const json = await request.json()
    const data = labelSchema.parse(json)

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const label = await prisma.label.create({
      data: {
        ...data,
        boardId
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json()
    const { id, ...data } = json
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Valid label ID is required' },
        { status: 400 }
      )
    }

    const validData = labelSchema.parse(data)

    const label = await prisma.label.update({
      where: { id },
      data: validData
    })

    return NextResponse.json(label)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const labelId = searchParams.get('labelId')

    if (!labelId || isNaN(parseInt(labelId))) {
      return NextResponse.json(
        { error: 'Valid label ID is required' },
        { status: 400 }
      )
    }

    await prisma.label.delete({
      where: { id: parseInt(labelId) }
    })

    return NextResponse.json(
      { message: 'Label deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return handleError(error)
  }
} 