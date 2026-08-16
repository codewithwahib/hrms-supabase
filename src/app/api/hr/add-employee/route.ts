// // app/api/hr/add-employee/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { client } from '@/sanity/lib/client'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     console.log('Received payload:', body)

//     const { personalDetails, qualifications, experience, username, password } = body

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

//     if (!personalDetails.fatherName) {
//       return NextResponse.json(
//         { success: false, error: 'Father name is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.cnicNumber) {
//       return NextResponse.json(
//         { success: false, error: 'CNIC number is required' },
//         { status: 400 }
//       )
//     }

//     // Validate CNIC length
//     if (personalDetails.cnicNumber.length !== 13) {
//       return NextResponse.json(
//         { success: false, error: 'CNIC number must be exactly 13 digits' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.phoneNumber) {
//       return NextResponse.json(
//         { success: false, error: 'Phone number is required' },
//         { status: 400 }
//       )
//     }

//     // Validate phone number length
//     if (personalDetails.phoneNumber.length !== 11) {
//       return NextResponse.json(
//         { success: false, error: 'Phone number must be exactly 11 digits' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.emergencyContact) {
//       return NextResponse.json(
//         { success: false, error: 'Emergency contact is required' },
//         { status: 400 }
//       )
//     }

//     // Validate emergency contact length
//     if (personalDetails.emergencyContact.length !== 11) {
//       return NextResponse.json(
//         { success: false, error: 'Emergency contact must be exactly 11 digits' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.dateOfBirth) {
//       return NextResponse.json(
//         { success: false, error: 'Date of birth is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.maritalStatus) {
//       return NextResponse.json(
//         { success: false, error: 'Marital status is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.residentialAddress) {
//       return NextResponse.json(
//         { success: false, error: 'Residential address is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.joiningDate) {
//       return NextResponse.json(
//         { success: false, error: 'Joining date is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.department) {
//       return NextResponse.json(
//         { success: false, error: 'Department is required' },
//         { status: 400 }
//       )
//     }

//     if (!personalDetails.position) {
//       return NextResponse.json(
//         { success: false, error: 'Position/Designation is required' },
//         { status: 400 }
//       )
//     }

//     // CV is optional - no validation needed

//     if (!username) {
//       return NextResponse.json(
//         { success: false, error: 'Username is required' },
//         { status: 400 }
//       )
//     }

//     if (!password) {
//       return NextResponse.json(
//         { success: false, error: 'Password is required' },
//         { status: 400 }
//       )
//     }

//     if (password.length < 6) {
//       return NextResponse.json(
//         { success: false, error: 'Password must be at least 6 characters' },
//         { status: 400 }
//       )
//     }

//     // =====================================================
//     // ✅ DUPLICATE CHECKS - Employee ID, CNIC, Username
//     // =====================================================

//     // 1. Check if Employee ID already exists
//     const existingEmployeeId = await client.fetch(
//       `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]`,
//       {
//         employeeId: personalDetails.employeeId
//       }
//     )

//     if (existingEmployeeId) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           error: `❌ Employee ID "${personalDetails.employeeId}" already exists. Please use a different ID.`,
//           field: 'employeeId'
//         },
//         { status: 409 }
//       )
//     }

//     // 2. Check if CNIC already exists
//     const existingCNIC = await client.fetch(
//       `*[_type == "employee" && personalDetails.cnicNumber == $cnicNumber][0]`,
//       {
//         cnicNumber: personalDetails.cnicNumber
//       }
//     )

//     if (existingCNIC) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           error: '❌ Employee with this CNIC number already exists.',
//           field: 'cnicNumber'
//         },
//         { status: 409 }
//       )
//     }

//     // 3. Check if Username already exists
//     const existingUsername = await client.fetch(
//       `*[_type == "employee" && username == $username][0]`,
//       { username }
//     )

//     if (existingUsername) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           error: '❌ Username already taken. Please choose another.',
//           field: 'username'
//         },
//         { status: 409 }
//       )
//     }

//     // =====================================================
//     // ✅ ALL CHECKS PASSED - Create Employee
//     // =====================================================

//     // Prepare CV field - only if CV is provided
//     let cvField = {}
//     if (personalDetails.cv && personalDetails.cv !== '') {
//       cvField = {
//         cv: {
//           _type: 'file',
//           asset: {
//             _type: 'reference',
//             _ref: personalDetails.cv
//           }
//         }
//       }
//     }

//     // Create the employee document
//     const newEmployee = {
//       _type: 'employee',
//       personalDetails: {
//         employeeId: personalDetails.employeeId,
//         fullName: personalDetails.fullName,
//         fatherName: personalDetails.fatherName,
//         cnicNumber: personalDetails.cnicNumber,
//         phoneNumber: personalDetails.phoneNumber,
//         emergencyContact: personalDetails.emergencyContact,
//         dateOfBirth: personalDetails.dateOfBirth,
//         maritalStatus: personalDetails.maritalStatus,
//         residentialAddress: personalDetails.residentialAddress,
//         joiningDate: personalDetails.joiningDate,
//         department: personalDetails.department,
//         position: personalDetails.position,
//         ...cvField
//       },
//       qualifications: qualifications || [],
//       experience: experience || [],
//       username: username,
//       password: password,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     }

//     console.log('Creating employee:', newEmployee)

//     // Save to Sanity
//     const result = await client.create(newEmployee)

//     console.log('Employee created successfully:', result)

//     return NextResponse.json({
//       success: true,
//       message: '✅ Employee added successfully!',
//       data: result
//     })

//   } catch (error) {
//     console.error('Error adding employee:', error)
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: error instanceof Error ? error.message : 'Failed to add employee' 
//       },
//       { status: 500 }
//     )
//   }
// }



// app/api/hr/add-employee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received payload:', body)

    const { personalDetails, qualifications, experience, username, password } = body

    // Validate required fields
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

    if (!personalDetails.fatherName) {
      return NextResponse.json(
        { success: false, error: 'Father name is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.cnicNumber) {
      return NextResponse.json(
        { success: false, error: 'CNIC number is required' },
        { status: 400 }
      )
    }

    // Validate CNIC length
    if (personalDetails.cnicNumber.length !== 13) {
      return NextResponse.json(
        { success: false, error: 'CNIC number must be exactly 13 digits' },
        { status: 400 }
      )
    }

    if (!personalDetails.phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone number length
    if (personalDetails.phoneNumber.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      )
    }

    if (!personalDetails.emergencyContact) {
      return NextResponse.json(
        { success: false, error: 'Emergency contact is required' },
        { status: 400 }
      )
    }

    // Validate emergency contact length
    if (personalDetails.emergencyContact.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'Emergency contact must be exactly 11 digits' },
        { status: 400 }
      )
    }

    if (!personalDetails.dateOfBirth) {
      return NextResponse.json(
        { success: false, error: 'Date of birth is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.maritalStatus) {
      return NextResponse.json(
        { success: false, error: 'Marital status is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.residentialAddress) {
      return NextResponse.json(
        { success: false, error: 'Residential address is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.joiningDate) {
      return NextResponse.json(
        { success: false, error: 'Joining date is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.department) {
      return NextResponse.json(
        { success: false, error: 'Department is required' },
        { status: 400 }
      )
    }

    if (!personalDetails.position) {
      return NextResponse.json(
        { success: false, error: 'Position/Designation is required' },
        { status: 400 }
      )
    }

    // CV is optional - no validation needed

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // =====================================================
    // ✅ DUPLICATE CHECKS - Employee ID, CNIC, Username
    // =====================================================

    // 1. Check if Employee ID already exists
    const existingEmployeeId = await client.fetch(
      `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]`,
      {
        employeeId: personalDetails.employeeId
      }
    )

    if (existingEmployeeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `❌ Employee ID "${personalDetails.employeeId}" already exists. Please use a different ID.`,
          field: 'employeeId'
        },
        { status: 409 }
      )
    }

    // 2. Check if CNIC already exists
    const existingCNIC = await client.fetch(
      `*[_type == "employee" && personalDetails.cnicNumber == $cnicNumber][0]`,
      {
        cnicNumber: personalDetails.cnicNumber
      }
    )

    if (existingCNIC) {
      return NextResponse.json(
        { 
          success: false, 
          error: '❌ Employee with this CNIC number already exists.',
          field: 'cnicNumber'
        },
        { status: 409 }
      )
    }

    // 3. Check if Username already exists
    const existingUsername = await client.fetch(
      `*[_type == "employee" && username == $username][0]`,
      { username }
    )

    if (existingUsername) {
      return NextResponse.json(
        { 
          success: false, 
          error: '❌ Username already taken. Please choose another.',
          field: 'username'
        },
        { status: 409 }
      )
    }

    // =====================================================
    // ✅ ALL CHECKS PASSED - Create Employee
    // =====================================================

    // Prepare CV field - only if CV is provided
    let cvField = {}
    if (personalDetails.cv && personalDetails.cv !== '') {
      cvField = {
        cv: {
          _type: 'file',
          asset: {
            _type: 'reference',
            _ref: personalDetails.cv
          }
        }
      }
    }

    // Create the employee document
    const newEmployee = {
      _type: 'employee',
      personalDetails: {
        employeeId: personalDetails.employeeId,
        fullName: personalDetails.fullName,
        fatherName: personalDetails.fatherName,
        cnicNumber: personalDetails.cnicNumber,
        phoneNumber: personalDetails.phoneNumber,
        emergencyContact: personalDetails.emergencyContact,
        dateOfBirth: personalDetails.dateOfBirth,
        maritalStatus: personalDetails.maritalStatus,
        residentialAddress: personalDetails.residentialAddress,
        joiningDate: personalDetails.joiningDate,
        department: personalDetails.department,
        position: personalDetails.position,
        ...cvField
      },
      qualifications: qualifications || [],
      experience: experience || [],
      username: username,
      password: password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Creating employee:', newEmployee)

    // Save to Sanity
    const result = await client.create(newEmployee)

    console.log('Employee created successfully:', result)

    return NextResponse.json({
      success: true,
      message: '✅ Employee added successfully!',
      data: result
    })

  } catch (error) {
    console.error('Error adding employee:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add employee' 
      },
      { status: 500 }
    )
  }
}