// // src/app/api/site-visit-history/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@sanity/client'

// // ✅ Force dynamic rendering to fix build error
// export const dynamic = 'force-dynamic'

// // Initialize Sanity client
// const sanityClient = createClient({
//   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
//   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
//   apiVersion: '2024-01-01',
//   token: process.env.SANITY_API_TOKEN || '',
//   useCdn: false,
// })

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const employeeId = searchParams.get('employeeId')

//     if (!employeeId) {
//       return NextResponse.json(
//         { success: false, error: 'Employee ID is required' },
//         { status: 400 }
//       )
//     }

//     const query = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
//       _id,
//       personalDetails {
//         employeeId,
//         fullName,
//         department,
//         position,
//         fatherName,
//         cnic,
//         phoneNumber,
//         email,
//         address,
//         joiningDate,
//         dob,
//         maritalStatus,
//         emergencyContact
//       },
//       enableSiteVisits,
//       siteVisits[] {
//         _key,
//         _type,
//         companyName,
//         customerName,
//         projectName,
//         salesPerson,
//         visitDate,
//         fromTime,
//         toTime,
//         location,
//         followUps,
//         notes,
//         liveLocation {
//           latitude,
//           longitude,
//           accuracy,
//           address,
//           timestamp
//         }
//       }
//     }`

//     const data = await sanityClient.fetch(query, { employeeId })

//     if (!data) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     return NextResponse.json({ 
//       success: true, 
//       data,
//       enabled: data.enableSiteVisits || false
//     })
//   } catch (error) {
//     console.error('GET Error:', error)
//     return NextResponse.json(
//       { success: false, error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

// src/app/api/site-visit-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ Force dynamic rendering to fix build error
export const dynamic = 'force-dynamic'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // ✅ Fetch employee with all details and site_visits
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (error || !employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Format response to match the expected structure
    const formattedData = {
      _id: employee.id,
      personalDetails: {
        employeeId: employee.employee_id,
        fullName: employee.full_name,
        department: employee.department,
        position: employee.position,
        fatherName: employee.father_name,
        cnic: employee.cnic_number,
        phoneNumber: employee.phone_number,
        email: null, // Not in table schema, kept for compatibility
        address: employee.residential_address,
        joiningDate: employee.joining_date,
        dob: employee.date_of_birth,
        maritalStatus: employee.marital_status,
        emergencyContact: employee.emergency_contact
      },
      enableSiteVisits: employee.enable_site_visits || false,
      siteVisits: employee.site_visits || []
    }

    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      enabled: employee.enable_site_visits || false
    })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}