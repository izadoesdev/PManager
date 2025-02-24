import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { Priority } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority') as Priority | 'all' | null
    const dueDate = searchParams.get('dueDate')
    const labels = searchParams.get('labels')?.split(',').map(Number)

    if (!query) {
      return new NextResponse('Search query is required', { status: 400 })
    }

    const results = []

    // Search boards if type is 'all' or 'board'
    if (type === 'all' || type === 'board') {
      const boards = await prisma.board.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } }
          ],
          status: 'active'
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true
        }
      })

      results.push(...boards.map(board => ({
        ...board,
        type: 'board',
        boardId: board.id
      })))
    }

    // Search lists if type is 'all' or 'list'
    if (type === 'all' || type === 'list') {
      const lists = await prisma.list.findMany({
        where: {
          title: { contains: query },
          status: 'active',
          board: { status: 'active' }
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          boardId: true,
          board: {
            select: {
              title: true
            }
          }
        }
      })

      results.push(...lists.map(list => ({
        id: list.id,
        type: 'list',
        title: list.title,
        createdAt: list.createdAt,
        boardId: list.boardId,
        boardTitle: list.board.title
      })))
    }

    // Search cards if type is 'all' or 'card'
    if (type === 'all' || type === 'card') {
      const cards = await prisma.card.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } }
          ],
          status: 'active',
          list: {
            status: 'active',
            board: { status: 'active' }
          },
          ...(priority && priority !== 'all' ? { priority } : {}),
          ...(dueDate && {
            dueDate: {
              gte: new Date(dueDate),
              lt: new Date(new Date(dueDate).setDate(new Date(dueDate).getDate() + 1))
            }
          }),
          ...(labels?.length ? {
            labels: {
              some: {
                id: { in: labels }
              }
            }
          } : {})
        },
        include: {
          list: {
            include: {
              board: {
                select: {
                  title: true
                }
              }
            }
          },
          labels: true
        }
      })

      results.push(...cards.map(card => ({
        id: card.id,
        type: 'card',
        title: card.title,
        description: card.description,
        priority: card.priority,
        dueDate: card.dueDate,
        createdAt: card.createdAt,
        boardId: card.list.boardId,
        boardTitle: card.list.board.title,
        listId: card.list.id,
        listTitle: card.list.title,
        labels: card.labels
      })))
    }

    // Sort results by relevance and recency
    results.sort((a, b) => {
      // Exact title matches first
      const aExactMatch = a.title.toLowerCase() === query.toLowerCase()
      const bExactMatch = b.title.toLowerCase() === query.toLowerCase()
      if (aExactMatch && !bExactMatch) return -1
      if (!aExactMatch && bExactMatch) return 1

      // Then by creation date
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error performing search:', error)
    return new NextResponse('Error performing search', { status: 500 })
  }
} 