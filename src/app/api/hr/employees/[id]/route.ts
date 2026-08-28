// // app/api/hr/employees/[id]/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client' // Changed from serverClient to client

// // GET - Fetch single employee (optional)
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params

//     const query = `*[_type == "employee" && _id == $id][0] {
//       _id,
//       personalDetails,
//       qualifications,
//       experience,
//       checkIn,
//       checkOut,
//       username,
//       password,
//       _createdAt,
//       _updatedAt
//     }`
    
//     const employee = await client.fetch(query, { id }) // Changed from serverClient to client

//     if (!employee) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     return NextResponse.json({
//       success: true,
//       data: employee
//     })

//   } catch (error) {
//     console.error('Error fetching employee:', error)
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: error instanceof Error ? error.message : 'Failed to fetch employee' 
//       },
//       { status: 500 }
//     )
//   }
// }

// // PUT - Update employee
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params
//     const body = await request.json()
//     const { personalDetails } = body

//     // Validate required fields
//     if (!personalDetails) {
//       return NextResponse.json(
//         { success: false, error: 'Personal details are required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.employeeId) {
//       return NextResponse.json(
//         { success: false, error: 'Employee ID is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.fullName) {
//       return NextResponse.json(
//         { success: false, error: 'Full name is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.phoneNumber) {
//       return NextResponse.json(
//         { success: false, error: 'Phone number is required' },
//         { status: 400 }
//       )
//     }

//     // Check if employee exists
//     const existingEmployee = await client.fetch( // Changed from serverClient to client
//       `*[_type == "employee" && _id == $id][0]`,
//       { id }
//     )

//     if (!existingEmployee) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     // Check if employee with same ID or CNIC exists (excluding current)
//     const duplicateCheck = await client.fetch( // Changed from serverClient to client
//       `*[_type == "employee" && _id != $id && (personalDetails.employeeId == $employeeId || personalDetails.cnic == $cnic)][0]`,
//       {
//         id,
//         employeeId: personalDetails.employeeId,
//         cnic: personalDetails.cnic
//       }
//     )

//     if (duplicateCheck) {
//       return NextResponse.json(
//         { success: false, error: 'Employee with this ID or CNIC already exists' },
//         { status: 409 }
//       )
//     }

//     // Update the employee
//     const updatedEmployee = await client // Changed from serverClient to client
//       .patch(id)
//       .set({
//         'personalDetails': {
//           employeeId: personalDetails.employeeId,
//           fullName: personalDetails.fullName,
//           fatherName: personalDetails.fatherName || '',
//           cnic: personalDetails.cnic || '',
//           phoneNumber: personalDetails.phoneNumber,
//           emergencyContact: personalDetails.emergencyContact || '',
//           dob: personalDetails.dob || '',
//           maritalStatus: personalDetails.maritalStatus || '',
//           address: personalDetails.address || '',
//           joiningDate: personalDetails.joiningDate || '',
//           department: personalDetails.department || '',
//           position: personalDetails.position || '',
//           // Preserve existing CV if not updated
//           cv: existingEmployee.personalDetails?.cv || null
//         },
//         updatedAt: new Date().toISOString()
//       })
//       .commit()

//     console.log('Employee updated successfully:', updatedEmployee)

//     return NextResponse.json({
//       success: true,
//       message: 'Employee updated successfully',
//       data: updatedEmployee
//     })

//   } catch (error) {
//     console.error('Error updating employee:', error)
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: error instanceof Error ? error.message : 'Failed to update employee' 
//       },
//       { status: 500 }
//     )
//   }
// }

// // DELETE - Delete employee
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params

//     // Check if employee exists
//     const existingEmployee = await client.fetch( // Changed from serverClient to client
//       `*[_type == "employee" && _id == $id][0]`,
//       { id }
//     )

//     if (!existingEmployee) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     // Delete the employee
//     await client.delete(id) // Changed from serverClient to client

//     console.log('Employee deleted successfully:', id)

//     return NextResponse.json({
//       success: true,
//       message: 'Employee deleted successfully'
//     })

//   } catch (error) {
//     console.error('Error deleting employee:', error)
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: error instanceof Error ? error.message : 'Failed to delete employee' 
//       },
//       { status: 500 }
//     )
//   }
// }


// app/api/hr/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee'
      },
      { status: 500 }
    )
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { personalDetails } = body

    if (!personalDetails) {
      return NextResponse.json(
        { success: false, error: 'Personal details are required' },
        { status: 400 }
      )
    }

    if (!personalDetails.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.fullName) {
      return NextResponse.json(
        { success: false, error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check for duplicates (excluding current)
    const { data: duplicate, error: dupError } = await supabase
      .from('employees')
      .select('id')
      .neq('id', id)
      .or(`employee_id.eq.${personalDetails.employeeId},cnic_number.eq.${personalDetails.cnic}`)
      .maybeSingle()

    if (dupError && dupError.code !== 'PGRST116') {
      throw new Error(dupError.message)
    }

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'Employee with this ID or CNIC already exists' },
        { status: 409 }
      )
    }

    // Update employee
    const updateData = {
      employee_id: personalDetails.employeeId,
      full_name: personalDetails.fullName,
      father_name: personalDetails.fatherName || '',
      cnic_number: personalDetails.cnic || '',
      phone_number: personalDetails.phoneNumber,
      emergency_contact: personalDetails.emergencyContact || '',
      date_of_birth: personalDetails.dob || '',
      marital_status: personalDetails.maritalStatus || '',
      residential_address: personalDetails.address || '',
      joining_date: personalDetails.joiningDate || '',
      department: personalDetails.department || '',
      position: personalDetails.position || '',
      updated_at: new Date().toISOString()
    }

    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    console.log('Employee updated successfully:', updatedEmployee)

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update employee'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Delete employee
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    console.log('Employee deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete employee'
      },
      { status: 500 }
    )
  }
}