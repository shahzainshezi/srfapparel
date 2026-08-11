import { NextResponse } from 'next/server'

/**
 * Validates the request Authorization header against process.env.CLIENT_API_SECRET
 * Returns a 401 NextResponse if unauthorized, or null if authorized.
 */
export function validateApiAuth(request: Request): NextResponse | null {
  const secretKey = process.env.CLIENT_API_SECRET || 'srf_secret_api_key_2026_x9k'
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing Authorization header' },
      { status: 401 }
    )
  }

  const expectedToken = `Bearer ${secretKey}`
  if (authHeader.trim() !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API key' },
      { status: 401 }
    )
  }

  return null // Auth succeeded
}
