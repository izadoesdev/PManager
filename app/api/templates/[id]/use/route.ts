import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    const { title, description } = data

    // Get the template with its lists and cards
    const template = await prisma.template.findUnique({
      where: { id: parseInt(id) },
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
      return new NextResponse('Template not found', { status: 404 })
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
    console.error('Error creating board from template:', error)
    return new NextResponse('Error creating board from template', { status: 500 })
  }
} 