import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting template:', error)
    return new NextResponse('Error deleting template', { status: 500 })
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
    console.error('Error updating template:', error)
    return new NextResponse('Error updating template', { status: 500 })
  }
} 