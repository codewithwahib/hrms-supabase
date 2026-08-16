// // app/api/hr/check-username/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client'

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const username = searchParams.get('username')

//     if (!username) {
//       return NextResponse.json(
//         { error: 'Username is required' },
//         { status: 400 }
//       )
//     }

//     const query = `
//       *[_type == "employee" && username == $username][0] {
//         _id
//       }
//     `

//     const result = await client.fetch(query, { username })

//     return NextResponse.json({
//       exists: !!result,
//       username
//     })
//   } catch (error) {
//     console.error('Error checking username:', error)
//     return NextResponse.json(
//       { error: 'Failed to check username' },
//       { status: 500 }
//     )
//   }
// }



// app/api/hr/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic' // ✅ Add this line

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const query = `
      *[_type == "employee" && username == $username][0] {
        _id
      }
    `

    const result = await client.fetch(query, { username })

    return NextResponse.json({
      exists: !!result,
      username
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json(
      { error: 'Failed to check username' },
      { status: 500 }
    )
  }
}