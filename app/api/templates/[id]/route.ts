import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete all cards in template lists
    await prisma.templateCard.deleteMany({
      where: { list: { templateId: parseInt(id) } }
    })

    // Delete all lists in template
    await prisma.templateList.deleteMany({
      where: { templateId: parseInt(id) }
    })

    // Delete the template
    await prisma.template.delete({
      where: { id: parseInt(id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting template:', error)
    return new NextResponse('Error deleting template', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    const { name, description } = data

    const template = await prisma.template.update({
      where: { id: parseInt(id) },
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