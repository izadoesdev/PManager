import { NextResponse } from 'next/server'

const CORRECT_PASSWORD = process.env.AUTH_PASSWORD || 'password123'
const COOKIE_NAME = 'auth-cookie'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (password !== CORRECT_PASSWORD) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Set cookie with 30 day expiry
    const response = new NextResponse('OK', { status: 200 })
    response.cookies.set({
      name: COOKIE_NAME,
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    })

    return response
  } catch (error) {
    console.error('Auth error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 