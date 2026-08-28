// app/api/hr/check-employee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // or your supabase client path

export const dynamic = 'force-dynamic' // ✅ Same - stays as is

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

    // ✅ Supabase equivalent - check if employee exists
    const supabase = await createClient() // or your supabase client
    
    const { data, error } = await supabase
      .from('employees') // your table name (could be 'employee' too)
      .select('id')
      .eq('personalDetails->>employeeId', employeeId) // or just .eq('employee_id', employeeId) if flat field
      .maybeSingle() // returns null if not found, instead of error

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to check employee ID' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      exists: !!data,
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