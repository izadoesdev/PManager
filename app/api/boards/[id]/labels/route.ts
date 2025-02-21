import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const labels = await prisma.label.findMany({
      where: { boardId: parseInt(id) },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return new NextResponse('Error fetching labels', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    const label = await prisma.label.create({
      data: {
        name: data.name,
        color: data.color,
        boardId: parseInt(id)
      }
    })
    
    return NextResponse.json(label)
  } catch (error) {
    console.error('Error creating label:', error)
    return new NextResponse('Error creating label', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const label = await prisma.label.update({
      where: { id: data.id },
      data: {
        name: data.name,
        color: data.color
      }
    })
    
    return NextResponse.json(label)
  } catch (error) {
    console.error('Error updating label:', error)
    return new NextResponse('Error updating label', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const labelId = searchParams.get('labelId')
    
    if (!labelId) {
      return new NextResponse('Label ID is required', { status: 400 })
    }

    await prisma.label.delete({
      where: { id: parseInt(labelId) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting label:', error)
    return new NextResponse('Error deleting label', { status: 500 })
  }
} 