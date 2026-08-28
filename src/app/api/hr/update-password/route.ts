// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client' // Removed serverClient, only using client

// export async function GET() {
//   try {
//     const login = await client.fetch(
//       `*[_type == "login"][0]{
//         _id,
//         username,
//         password
//       }`
//     )

//     return NextResponse.json({
//       success: true,
//       data: login ? [login] : [],
//     })
//   } catch (error) {
//     console.error('GET login error:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Failed to fetch login data',
//       },
//       { status: 500 }
//     )
//   }
// }

// export async function PUT(request: NextRequest) {
//   try {
//     const body = await request.json()

//     const {
//       adminId,
//       username,
//       newPassword,
//       confirmPassword,
//     } = body

//     if (!adminId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Login ID is required',
//         },
//         { status: 400 }
//       )
//     }

//     if (!newPassword) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'New password is required',
//         },
//         { status: 400 }
//       )
//     }

//     if (!confirmPassword) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Confirm password is required',
//         },
//         { status: 400 }
//       )
//     }

//     if (newPassword !== confirmPassword) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Passwords do not match',
//         },
//         { status: 400 }
//       )
//     }

//     // Check if the login document exists
//     const currentLogin = await client.fetch( // Changed from serverClient to client
//       `*[_type == "login" && _id == $id][0]{
//         _id,
//         username
//       }`,
//       {
//         id: adminId,
//       }
//     )

//     if (!currentLogin) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Login document not found',
//         },
//         { status: 404 }
//       )
//     }

//     // Update the login document
//     const updatedLogin = await client // Changed from serverClient to client
//       .patch(adminId)
//       .set({
//         username: username || currentLogin.username,
//         password: newPassword, // Note: Consider hashing this password
//       })
//       .commit()

//     return NextResponse.json({
//       success: true,
//       data: updatedLogin,
//       message: 'Password updated successfully',
//     })
//   } catch (error) {
//     console.error('PUT password error:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error instanceof Error
//             ? error.message
//             : 'Failed to update password',
//       },
//       { status: 500 }
//     )
//   }
// }


// app/api/hr/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // ✅ Fetch login from Supabase (logins table)
    const { data: login, error } = await supabase
      .from('logins')
      .select('username, password')
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: login ? [login] : [],
    })
  } catch (error) {
    console.error('GET login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch login data',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, newPassword, confirmPassword } = body

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username is required',
        },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password is required',
        },
        { status: 400 }
      )
    }

    if (!confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirm password is required',
        },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // ✅ Check if the login exists by username
    const { data: currentLogin, error: fetchError } = await supabase
      .from('logins')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!currentLogin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Login not found',
        },
        { status: 404 }
      )
    }

    // ✅ Update the login by username
    const { data: updatedLogin, error: updateError } = await supabase
      .from('logins')
      .update({
        password: newPassword,
      })
      .eq('username', username)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    return NextResponse.json({
      success: true,
      data: updatedLogin,
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('PUT password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password',
      },
      { status: 500 }
    )
  }
}