import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // TODO: Replace with real authentication (database lookup, OAuth, etc.)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@wptp.org"
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123"

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true })

    response.cookies.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}
