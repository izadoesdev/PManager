import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

export async function POST(request: Request) {
  try {
    const id = parseInt(request.url.split('/templates/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { title, description } = data

    // Get the template with its lists and cards
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            cards: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Create a new board from the template
    const board = await prisma.board.create({
      data: {
        title,
        description,
        lists: {
          create: template.lists.map(list => ({
            title: list.title,
            order: list.order,
            cards: {
              create: list.cards.map(card => ({
                title: card.title,
                description: card.description,
                priority: card.priority,
                order: card.order,
                estimatedTime: card.estimatedTime
              }))
            }
          }))
        }
      },
      include: {
        lists: {
          include: {
            cards: true
          }
        }
      }
    })

    return NextResponse.json(board)
  } catch (error) {
    return handleError(error)
  }
} 