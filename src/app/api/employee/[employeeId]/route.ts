// // src/app/api/attendance/reset/[employeeId]/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client'

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { employeeId: string } }
// ) {
//   try {
//     const { employeeId } = params

//     console.log('🔄 Resetting attendance for employee:', employeeId)

//     if (!employeeId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Employee ID is required',
//         },
//         { status: 400 }
//       )
//     }

//     // Find employee with their check-in and check-out records
//     const employee = await client.fetch(
//       `*[
//         _type == "employee" &&
//         personalDetails.employeeId == $employeeId
//       ][0]{
//         _id,
//         _type,
//         checkIn,
//         checkOut,
//         personalDetails
//       }`,
//       { employeeId }
//     )

//     if (!employee) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Employee not found: ${employeeId}`,
//         },
//         { status: 404 }
//       )
//     }

//     console.log('📋 Found employee:', employee.personalDetails?.fullName || employeeId)
//     console.log('📋 Current check-ins:', employee.checkIn?.length || 0)
//     console.log('📋 Current check-outs:', employee.checkOut?.length || 0)

//     const today = new Date().toISOString().split('T')[0]
//     console.log('📅 Today\'s date:', today)

//     // Filter out today's check-in records
//     const updatedCheckIn = employee.checkIn?.filter(
//       (record: any) => {
//         if (!record || !record.time) return true
//         const recordDate = record.time.split('T')[0]
//         return recordDate !== today
//       }
//     ) || []

//     // Filter out today's check-out records
//     const updatedCheckOut = employee.checkOut?.filter(
//       (record: any) => {
//         if (!record || !record.time) return true
//         const recordDate = record.time.split('T')[0]
//         return recordDate !== today
//       }
//     ) || []

//     const removedCheckIns = (employee.checkIn?.length || 0) - updatedCheckIn.length
//     const removedCheckOuts = (employee.checkOut?.length || 0) - updatedCheckOut.length

//     console.log(`🗑️ Removing ${removedCheckIns} check-in records and ${removedCheckOuts} check-out records for today`)

//     // Update employee document with filtered arrays
//     const updatedEmployee = await client
//       .patch(employee._id)
//       .set({
//         checkIn: updatedCheckIn,
//         checkOut: updatedCheckOut,
//       })
//       .commit()

//     console.log('✅ Attendance reset successfully for employee:', employeeId)
//     console.log('✅ Updated check-ins:', updatedCheckIn.length)
//     console.log('✅ Updated check-outs:', updatedCheckOut.length)

//     return NextResponse.json({
//       success: true,
//       message: 'Attendance reset successfully',
//       data: {
//         employeeId,
//         removedCheckIns,
//         removedCheckOuts,
//         updatedCheckInCount: updatedCheckIn.length,
//         updatedCheckOutCount: updatedCheckOut.length,
//         today,
//       },
//     })

//   } catch (error) {
//     console.error('❌ Reset error:', error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to reset attendance',
//         details: error instanceof Error ? error.stack : undefined,
//       },
//       { status: 500 }
//     )
//   }
// }



// src/app/api/employee/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params

    console.log('==============================')
    console.log('GET EMPLOYEE REQUEST')
    console.log('Employee ID:', employeeId)
    console.log('==============================')

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required',
        },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch employee from Supabase
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle()

    console.log('FOUND EMPLOYEE:')
    console.log(employee)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${fetchError.message}`,
        },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee not found: ${employeeId}`,
        },
        { status: 404 }
      )
    }

    // Transform data to match frontend expected format
    const transformedEmployee = {
      id: employee.id,
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      father_name: employee.father_name,
      cnic_number: employee.cnic_number,
      phone_number: employee.phone_number,
      emergency_contact: employee.emergency_contact,
      date_of_birth: employee.date_of_birth,
      marital_status: employee.marital_status,
      residential_address: employee.residential_address,
      joining_date: employee.joining_date,
      department: employee.department,
      position: employee.position,
      username: employee.username,
      qualifications: employee.qualifications || [],
      experience: employee.experience || [],
      check_in: employee.check_in || [],
      check_out: employee.check_out || [],
      cv_url: employee.cv_url,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    }

    return NextResponse.json({
      success: true,
      data: transformedEmployee,
    })
  } catch (error) {
    console.error('GET EMPLOYEE ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch employee',
      },
      { status: 500 }
    )
  }
}