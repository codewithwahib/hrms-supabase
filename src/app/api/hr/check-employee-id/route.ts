// app/api/hr/check-employee-id/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic' // ✅ Add this line

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const query = `
      *[_type == "employee" && personalDetails.employeeId == $employeeId][0] {
        _id
      }
    `

    const result = await client.fetch(query, { employeeId })

    return NextResponse.json({
      exists: !!result,
      employeeId
    })
  } catch (error) {
    console.error('Error checking employee ID:', error)
    return NextResponse.json(
      { error: 'Failed to check employee ID' },
      { status: 500 }
    )
  }
}