// import { NextResponse } from "next/server";

// export async function POST() {
//   const response = NextResponse.json({ message: "Logged out" });
//   response.cookies.set("hrms_token", "", { maxAge: 0, path: "/" });
//   return response;
// }

// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // ✅ Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })

    // ✅ Clear cookies
    response.cookies.set('hrms_token', '', { 
      maxAge: 0, 
      path: '/' 
    })

    // ✅ Also clear any other auth cookies
    response.cookies.set('auth_token', '', { 
      maxAge: 0, 
      path: '/' 
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Logout failed' 
      },
      { status: 500 }
    )
  }
}