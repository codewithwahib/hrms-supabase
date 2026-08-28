// app/api/auth/hr-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = body.username?.trim()
    const password = body.password

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username and password are required',
        },
        {
          status: 400,
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // ✅ Query HR login from Supabase (logins table)
    const { data: user, error } = await supabase
      .from('logins')
      .select('username')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Database error',
        },
        {
          status: 500,
        }
      )
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        },
        {
          status: 401,
        }
      )
    }

    // ✅ Login successful - Send role
    return NextResponse.json({
      success: true,
      username: user.username,
      role: 'hr',  // ✅ Explicitly set role
    })

  } catch (error) {
    console.error('HR Login error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
      },
      {
        status: 500,
      }
    )
  }
}