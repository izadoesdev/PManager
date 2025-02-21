import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  console.error('Error:', errorMessage)
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

export async function DELETE(request: Request) {
  try {
    const id = parseInt(request.url.split('/templates/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Delete all cards in template lists
    await prisma.templateCard.deleteMany({
      where: { list: { templateId: id } }
    })

    // Delete all lists in template
    await prisma.templateList.deleteMany({
      where: { templateId: id }
    })

    // Delete the template
    await prisma.template.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const id = parseInt(request.url.split('/templates/')[1].split('/')[0])
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { name, description } = data

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        description
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    return handleError(error)
  }
} 