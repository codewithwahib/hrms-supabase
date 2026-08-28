// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@sanity/client'

// const client = createClient({
//   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
//   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
//   apiVersion: '2025-01-01',
//   useCdn: false,
// })

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()

//     const username = body.username?.trim()
//     const password = body.password

//     if (!username || !password) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: 'Username and password are required',
//         },
//         {
//           status: 400,
//         }
//       )
//     }

//     const user = await client.fetch(
//       `*[
//         _type == "login" &&
//         username == $username &&
//         password == $password
//       ][0]{
//         username
//       }`,
//       {
//         username,
//         password,
//       }
//     )

//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: 'Invalid username or password',
//         },
//         {
//           status: 401,
//         }
//       )
//     }

//     return NextResponse.json({
//       success: true,
//       username: user.username,
//       role: 'hr',
//     })
//   } catch (error) {
//     console.error('Login error:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         message: 'Server error',
//       },
//       {
//         status: 500,
//       }
//     )
//   }
// }


// app/api/auth/hr-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = body.username?.trim()
    const password = body.password

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

    // Query HR login from Supabase (logins table)
    const { data: user, error } = await supabase
      .from('logins')
      .select('id, username, role')
      .eq('username', username)
      .eq('password', password) // ⚠️ In production, use hashed passwords!
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

    // ✅ Check if user has HR role
    if (user.role !== 'hr') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. HR role required.',
        },
        {
          status: 403,
        }
      )
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      id: user.id,
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