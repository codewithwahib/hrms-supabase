// // app/api/attendance/check-in/route.ts
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

//     // Initialize Supabase client
//     const supabase = createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     // ✅ Find employee
//     const { data: employee, error: fetchError } = await supabase
//       .from('employees')
//       .select('id, employee_id, full_name, check_in')
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

//     // ✅ Check if already checked in today
//     const today = new Date().toISOString().split('T')[0]
//     const checkIns = employee.check_in || []
    
//     const alreadyCheckedIn = checkIns.some((record: any) => {
//       return record.time && record.time.split('T')[0] === today
//     })

//     if (alreadyCheckedIn) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'You have already checked in today!',
//         },
//         { status: 400 }
//       )
//     }

//     // ✅ Create check-in record
//     const newCheckIn = {
//       time: new Date().toISOString(),
//       location: location,
//       coordinates: {
//         lat: latitude || null,
//         lng: longitude || null
//       }
//     }

//     console.log('NEW CHECK-IN RECORD:', newCheckIn)

//     // ✅ Update employee with new check-in
//     const updatedCheckIns = [...checkIns, newCheckIn]

//     const { data: updatedEmployee, error: updateError } = await supabase
//       .from('employees')
//       .update({
//         check_in: updatedCheckIns,
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
//           error: `Failed to save check-in: ${updateError.message}`,
//         },
//         { status: 500 }
//       )
//     }

//     console.log('CHECK-IN COMMIT SUCCESS')
//     console.log(updatedEmployee)

//     return NextResponse.json({
//       success: true,
//       message: 'Check-in saved successfully',
//       data: {
//         employeeId: employee.employee_id,
//         record: newCheckIn,
//       },
//     })

//   } catch (error) {
//     console.error('CHECK-IN ERROR:', error)

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error
//           ? error.message
//           : 'Failed to save check-in',
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
      .select('id, employee_id, full_name, check_in')
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
    const checkIns = employee.check_in || []
    
    const alreadyCheckedIn = checkIns.some((record: any) => {
      return record.time && record.time.split('T')[0] === today
    })

    if (alreadyCheckedIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already checked in today!',
        },
        { status: 400 }
      )
    }

    const newCheckIn = {
      time: new Date().toISOString(),
      location: location,
      coordinates: {
        lat: latitude || null,
        lng: longitude || null
      }
    }

    const updatedCheckIns = [...checkIns, newCheckIn]

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
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save check-in: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in saved successfully',
      data: {
        employeeId: employee.employee_id,
        record: newCheckIn,
      },
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to save check-in',
      },
      { status: 500 }
    )
  }
}