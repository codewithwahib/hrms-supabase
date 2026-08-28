// // app/api/attendance/check-out/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js'

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
//     console.log('CHECK-OUT REQUEST')
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

//     // Initialize Supabase client
//     const supabase = createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     // ✅ Find employee
//     const { data: employee, error: fetchError } = await supabase
//       .from('employees')
//       .select('id, employee_id, full_name, check_in, check_out')
//       .eq('employee_id', employeeId)
//       .maybeSingle()

//     console.log('FOUND EMPLOYEE:', employee)

//     if (fetchError) {
//       console.error('Fetch error:', fetchError)
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Database error: ${fetchError.message}`,
//         },
//         { status: 500 }
//       )
//     }

//     if (!employee) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Employee not found: ${employeeId}`,
//         },
//         { status: 404 }
//       )
//     }

//     // ✅ Check if already checked out today
//     const today = new Date().toISOString().split('T')[0]
//     const checkOuts = employee.check_out || []
    
//     const alreadyCheckedOut = checkOuts.some((record: any) => {
//       return record.time && record.time.split('T')[0] === today
//     })

//     if (alreadyCheckedOut) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'You have already checked out today!',
//         },
//         { status: 400 }
//       )
//     }

//     // ✅ Check if checked in today
//     const checkIns = employee.check_in || []
//     const checkedInToday = checkIns.some((record: any) => {
//       return record.time && record.time.split('T')[0] === today
//     })

//     if (!checkedInToday) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Please check in first before checking out!',
//         },
//         { status: 400 }
//       )
//     }

//     // ✅ Create check-out record
//     const newCheckOut = {
//       time: new Date().toISOString(),
//       location: location,
//       coordinates: {
//         lat: latitude || null,
//         lng: longitude || null
//       }
//     }

//     console.log('NEW CHECK-OUT RECORD:', newCheckOut)

//     // ✅ Update employee with new check-out
//     const updatedCheckOuts = [...checkOuts, newCheckOut]

//     const { data: updatedEmployee, error: updateError } = await supabase
//       .from('employees')
//       .update({
//         check_out: updatedCheckOuts,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', employee.id)
//       .select()
//       .single()

//     if (updateError) {
//       console.error('Update error:', updateError)
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Failed to save check-out: ${updateError.message}`,
//         },
//         { status: 500 }
//       )
//     }

//     console.log('CHECK-OUT COMMIT SUCCESS')
//     console.log(updatedEmployee)

//     return NextResponse.json({
//       success: true,
//       message: 'Check-out saved successfully',
//       data: {
//         employeeId: employee.employee_id,
//         record: newCheckOut,
//       },
//     })

//   } catch (error) {
//     console.error('CHECK-OUT ERROR:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error
//           ? error.message
//           : 'Failed to save check-out',
//       },
//       { status: 500 }
//     )
//   }
// }


// app/api/attendance/check-out/route.ts
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('id, employee_id, full_name, check_in, check_out')
      .eq('employee_id', employeeId)
      .maybeSingle()

    if (fetchError) {
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

    const today = new Date().toISOString().split('T')[0]
    const checkOuts = employee.check_out || []
    
    const alreadyCheckedOut = checkOuts.some((record: any) => {
      return record.time && record.time.split('T')[0] === today
    })

    if (alreadyCheckedOut) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already checked out today!',
        },
        { status: 400 }
      )
    }

    const checkIns = employee.check_in || []
    const checkedInToday = checkIns.some((record: any) => {
      return record.time && record.time.split('T')[0] === today
    })

    if (!checkedInToday) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please check in first before checking out!',
        },
        { status: 400 }
      )
    }

    const newCheckOut = {
      time: new Date().toISOString(),
      location: location,
      coordinates: {
        lat: latitude || null,
        lng: longitude || null
      }
    }

    const updatedCheckOuts = [...checkOuts, newCheckOut]

    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({
        check_out: updatedCheckOuts,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save check-out: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Check-out saved successfully',
      data: {
        employeeId: employee.employee_id,
        record: newCheckOut,
      },
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to save check-out',
      },
      { status: 500 }
    )
  }
}