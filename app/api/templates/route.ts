import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

// Get all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        sourceBoard: {
          select: {
            title: true,
            description: true
          }
        },
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
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return new NextResponse('Error fetching templates', { status: 500 })
  }
}

// Create a new template from a board
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { boardId, name, description } = data

    // Get the source board with its lists and cards
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          where: { status: 'active' },
          include: {
            cards: {
              where: { status: 'active' }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!board) {
      return new NextResponse('Board not found', { status: 404 })
    }

    // Create the template
    const template = await prisma.template.create({
      data: {
        name,
        description,
        sourceBoardId: boardId,
        lists: {
          create: board.lists.map(list => ({
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

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return new NextResponse('Error creating template', { status: 500 })
  }
}

// Update a template
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, name, description } = data

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        description
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return new NextResponse('Error updating template', { status: 500 })
  }
} 