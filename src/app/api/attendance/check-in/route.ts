// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()

//     const {
//       employeeId,
//       location,
//       latitude,
//       longitude,
//     } = body

//     console.log('==============================')
//     console.log('CHECK-IN REQUEST')
//     console.log('Employee ID:', employeeId)
//     console.log('Location:', location)
//     console.log('Latitude:', latitude)
//     console.log('Longitude:', longitude)
//     console.log('==============================')

//     if (!employeeId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Employee ID is required',
//         },
//         { status: 400 }
//       )
//     }

//     if (!location) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Location is required',
//         },
//         { status: 400 }
//       )
//     }

//     // Find employee
//     const employee = await client.fetch(
//       `*[
//         _type == "employee" &&
//         personalDetails.employeeId == $employeeId
//       ][0]{
//         _id,
//         personalDetails,
//         checkIn
//       }`,
//       {
//         employeeId,
//       }
//     )

//     console.log('FOUND EMPLOYEE:')
//     console.log(employee)

//     if (!employee) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Employee not found: ${employeeId}`,
//         },
//         { status: 404 }
//       )
//     }

//     // Create check-in record
//     const checkInRecord = {
//       _type: 'checkInRecord',
//       _key: `check-in-${Date.now()}`,
//       time: new Date().toISOString(),
//       location: location,
//     }

//     console.log('NEW CHECK-IN RECORD:')
//     console.log(checkInRecord)

//     // Save to Sanity
//     const updatedEmployee = await client
//       .patch(employee._id)
//       .setIfMissing({
//         checkIn: [],
//       })
//       .append('checkIn', [checkInRecord])
//       .commit()

//     console.log('CHECK-IN COMMIT SUCCESS')
//     console.log(updatedEmployee)

//     return NextResponse.json({
//       success: true,
//       message: 'Check-in saved successfully',
//       data: {
//         employeeId,
//         employeeDocumentId: employee._id,
//         record: checkInRecord,
//         latitude,
//         longitude,
//       },
//     })
//   } catch (error) {
//     console.error('CHECK-IN ERROR:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error instanceof Error
//             ? error.message
//             : 'Failed to save check-in',
//       },
//       { status: 500 }
//     )
//   }
// }


// app/api/attendance/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      employeeId,
      location,
      latitude,
      longitude,
    } = body

    console.log('==============================')
    console.log('CHECK-IN REQUEST')
    console.log('Employee ID:', employeeId)
    console.log('Location:', location)
    console.log('Latitude:', latitude)
    console.log('Longitude:', longitude)
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

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location is required',
        },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find employee
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('id, employee_id, check_in')
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

    // Create check-in record
    const checkInRecord = {
      _key: `check-in-${Date.now()}`,
      time: new Date().toISOString(),
      location: location,
      coordinates: latitude && longitude ? {
        lat: latitude,
        lng: longitude
      } : undefined
    }

    console.log('NEW CHECK-IN RECORD:')
    console.log(checkInRecord)

    // Get existing check-ins or initialize empty array
    const existingCheckIns = employee.check_in || []
    const updatedCheckIns = [...existingCheckIns, checkInRecord]

    // Update employee in Supabase
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({
        check_in: updatedCheckIns,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save check-in: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    console.log('CHECK-IN COMMIT SUCCESS')
    console.log(updatedEmployee)

    return NextResponse.json({
      success: true,
      message: 'Check-in saved successfully',
      data: {
        employeeId,
        employeeDocumentId: employee.id,
        record: checkInRecord,
        latitude,
        longitude,
      },
    })
  } catch (error) {
    console.error('CHECK-IN ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save check-in',
      },
      { status: 500 }
    )
  }
}