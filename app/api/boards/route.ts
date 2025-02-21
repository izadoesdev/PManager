import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

interface BoardUpdateData {
  title?: string
  description?: string
  status?: 'active' | 'archived' | 'deleted'
  archivedAt?: Date | null
  deletedAt?: Date | null
}

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            lists: {
              where: { status: 'active' }
            }
          }
        },
        lists: {
          where: { status: 'active' },
          select: {
            _count: {
              select: {
                cards: {
                  where: { status: 'active' }
                }
              }
            }
          }
        }
      }
    })

    // Transform the data to include total card count
    const boardsWithCounts = boards.map(board => ({
      ...board,
      counts: {
        lists: board._count.lists,
        cards: board.lists.reduce((sum, list) => sum + list._count.cards, 0)
      },
      lists: undefined,
      _count: undefined
    }))
    
    return NextResponse.json(boardsWithCounts)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return new NextResponse('Error fetching boards', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const board = await prisma.board.create({
      data: {
        title: data.title,
        description: data.description
      }
    })
    
    return NextResponse.json(board)
  } catch (error) {
    console.error('Error creating board:', error)
    return new NextResponse('Error creating board', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    const updateData: BoardUpdateData = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
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

    const board = await prisma.board.update({
      where: { id: data.id },
      data: updateData
    })
    
    return NextResponse.json(board)
  } catch (error) {
    console.error('Error updating board:', error)
    return new NextResponse('Error updating board', { status: 500 })
  }
} 