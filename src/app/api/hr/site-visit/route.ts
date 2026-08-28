// // src/app/api/hr/site-visit/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@sanity/client'

// // Initialize Sanity client
// const sanityClient = createClient({
//   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
//   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
//   apiVersion: '2024-01-01',
//   token: process.env.SANITY_API_TOKEN || '',
//   useCdn: false,
// })

// // GET - Fetch all site visits
// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const employeeId = searchParams.get('employeeId')
//     const department = searchParams.get('department')
//     const fromDate = searchParams.get('fromDate')
//     const toDate = searchParams.get('toDate')

//     console.log('🔍 Site Visit API Called')
//     console.log('📌 Filters:', { employeeId, department, fromDate, toDate })

//     // Base query to get all employees with site visits
//     let query = `*[_type == "employee"]{
//       _id,
//       personalDetails {
//         employeeId,
//         fullName,
//         department,
//         position,
//         phoneNumber,
//         email
//       },
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

//     let data = await sanityClient.fetch(query)

//     // Safety check: if data is null or undefined, return empty array
//     if (!data) {
//       data = []
//     }

//     // Filter by employeeId if provided
//     if (employeeId) {
//       data = data.filter((emp: any) => emp.personalDetails?.employeeId === employeeId)
//     }

//     // Filter by department if provided
//     if (department && department !== 'all') {
//       data = data.filter((emp: any) => emp.personalDetails?.department === department)
//     }

//     // Process and flatten data
//     let allVisits: any[] = []
//     data.forEach((emp: any) => {
//       // Skip if employee has no siteVisits or siteVisits is not an array
//       if (!emp.siteVisits || !Array.isArray(emp.siteVisits) || emp.siteVisits.length === 0) {
//         return
//       }

//       emp.siteVisits.forEach((visit: any) => {
//         // Skip if visit is null or undefined
//         if (!visit) return

//         // Apply date filters
//         if (fromDate && toDate) {
//           if (visit.visitDate < fromDate || visit.visitDate > toDate) {
//             return
//           }
//         }

//         // Ensure employee data exists
//         const empData = emp.personalDetails || {}

//         allVisits.push({
//           ...visit,
//           employee: {
//             _id: emp._id || '',
//             employeeId: empData.employeeId || 'N/A',
//             fullName: empData.fullName || 'Unknown Employee',
//             department: empData.department || 'N/A',
//             position: empData.position || 'N/A',
//             phoneNumber: empData.phoneNumber || 'N/A',
//             email: empData.email || 'N/A'
//           }
//         })
//       })
//     })

//     // Sort by visit date (newest first)
//     allVisits.sort((a, b) => {
//       if (!a.visitDate || !b.visitDate) return 0
//       return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
//     })

//     // Calculate statistics (with safety checks)
//     const totalVisits = allVisits.length
//     const uniqueCompanies = new Set(allVisits.map((v: any) => v.companyName).filter(Boolean)).size
//     const uniqueCustomers = new Set(allVisits.map((v: any) => v.customerName).filter(Boolean)).size
//     const uniqueEmployees = new Set(allVisits.map((v: any) => v.employee?.employeeId).filter(Boolean)).size
//     const visitsWithLocation = allVisits.filter((v: any) => 
//       v.liveLocation && (v.liveLocation.latitude || v.liveLocation.longitude)
//     ).length

//     console.log('📊 Total visits found:', totalVisits)
//     console.log('📍 Visits with GPS:', visitsWithLocation)

//     return NextResponse.json({
//       success: true,
//       data: allVisits,
//       meta: {
//         totalVisits,
//         uniqueCompanies,
//         uniqueCustomers,
//         uniqueEmployees,
//         filteredEmployees: data.length,
//         visitsWithLocation
//       }
//     })

//   } catch (error) {
//     console.error('❌ Site Visit API Error:', error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Internal server error'
//       },
//       { status: 500 }
//     )
//   }
// }

// // POST - Add new site visit
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()

//     const {
//       employeeId,
//       companyName,
//       customerName,
//       projectName,
//       salesPerson,
//       visitDate,
//       fromTime,
//       toTime,
//       location,
//       followUps,
//       notes,
//       liveLocation,
//     } = body

//     console.log('📝 Creating new site visit for employee:', employeeId)
//     console.log('📍 Live Location received:', liveLocation ? 'Yes' : 'No')

//     // Validate required fields
//     if (!employeeId) {
//       return NextResponse.json(
//         { success: false, error: 'Employee ID is required' },
//         { status: 400 }
//       )
//     }

//     if (!companyName || !customerName || !visitDate || !fromTime || !toTime || !location) {
//       return NextResponse.json(
//         { success: false, error: 'All required fields must be filled' },
//         { status: 400 }
//       )
//     }

//     // Find employee by employeeId
//     const query = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
//       _id,
//       personalDetails
//     }`

//     const employee = await sanityClient.fetch(query, { employeeId })

//     if (!employee) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     // Ensure employee has personalDetails
//     if (!employee.personalDetails) {
//       return NextResponse.json(
//         { success: false, error: 'Employee personal details not found' },
//         { status: 400 }
//       )
//     }

//     // Generate unique _key
//     const timestamp = Date.now()
//     const randomStr = Math.random().toString(36).substring(2, 9)
//     const siteVisitKey = `visit_${timestamp}_${randomStr}`

//     // Prepare liveLocation object with safety checks
//     let locationData = {}
//     if (liveLocation && typeof liveLocation === 'object') {
//       locationData = {
//         latitude: liveLocation.latitude || 0,
//         longitude: liveLocation.longitude || 0,
//         accuracy: liveLocation.accuracy || 0,
//         address: liveLocation.address || '',
//         timestamp: liveLocation.timestamp || new Date().toISOString()
//       }
//     }

//     // Create site visit record
//     const siteVisit = {
//       _key: siteVisitKey,
//       _type: 'siteVisit',
//       companyName: companyName.trim(),
//       customerName: customerName.trim(),
//       projectName: projectName ? projectName.trim() : '',
//       salesPerson: salesPerson ? salesPerson.trim() : employee.personalDetails.fullName || '',
//       visitDate,
//       fromTime,
//       toTime,
//       location: location.trim(),
//       followUps: followUps ? followUps.trim() : '',
//       notes: notes ? notes.trim() : '',
//       liveLocation: locationData,
//     }

//     // Update employee document with new site visit
//     const updatedEmployee = await sanityClient
//       .patch(employee._id)
//       .setIfMissing({ siteVisits: [] })
//       .append('siteVisits', [siteVisit])
//       .commit()

//     console.log('✅ Site visit created successfully')

//     return NextResponse.json({
//       success: true,
//       message: 'Site visit recorded successfully',
//       data: updatedEmployee,
//     })

//   } catch (error) {
//     console.error('❌ POST Error:', error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Internal server error'
//       },
//       { status: 500 }
//     )
//   }
// }

// // DELETE - Delete a site visit
// export async function DELETE(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const employeeId = searchParams.get('employeeId')
//     const visitKey = searchParams.get('visitKey')

//     console.log('🗑️ Deleting site visit:', { employeeId, visitKey })

//     if (!employeeId || !visitKey) {
//       return NextResponse.json(
//         { success: false, error: 'Employee ID and Visit Key are required' },
//         { status: 400 }
//       )
//     }

//     // Find employee
//     const query = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
//       _id,
//       siteVisits
//     }`

//     const employee = await sanityClient.fetch(query, { employeeId })

//     if (!employee) {
//       return NextResponse.json(
//         { success: false, error: 'Employee not found' },
//         { status: 404 }
//       )
//     }

//     // Check if siteVisits exists and is an array
//     if (!employee.siteVisits || !Array.isArray(employee.siteVisits)) {
//       return NextResponse.json(
//         { success: false, error: 'No site visits found for this employee' },
//         { status: 404 }
//       )
//     }

//     // Check if visit with given key exists
//     const visitExists = employee.siteVisits.some((visit: any) => visit._key === visitKey)
//     if (!visitExists) {
//       return NextResponse.json(
//         { success: false, error: 'Visit not found' },
//         { status: 404 }
//       )
//     }

//     // Remove the visit with matching _key
//     const updatedSiteVisits = employee.siteVisits.filter(
//       (visit: any) => visit._key !== visitKey
//     )

//     // Update employee document
//     const updatedEmployee = await sanityClient
//       .patch(employee._id)
//       .set({ siteVisits: updatedSiteVisits })
//       .commit()

//     console.log('✅ Site visit deleted successfully')

//     return NextResponse.json({
//       success: true,
//       message: 'Site visit deleted successfully',
//       data: updatedEmployee,
//     })

//   } catch (error) {
//     console.error('❌ DELETE Error:', error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Internal server error'
//       },
//       { status: 500 }
//     )
//   }
// }



// app/api/hr/site-visit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch all site visits
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const department = searchParams.get('department')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    console.log('🔍 Site Visit API Called')
    console.log('📌 Filters:', { employeeId, department, fromDate, toDate })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Build query
    let query = supabase
      .from('employees')
      .select('id, employee_id, full_name, department, position, phone_number, site_visits')
      .order('full_name', { ascending: true })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (department && department !== 'all') {
      query = query.eq('department', department)
    }

    const { data: employeesData, error: fetchError } = await query

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // Process and flatten data
    let allVisits: any[] = []
    employeesData?.forEach((emp: any) => {
      if (!emp.site_visits || !Array.isArray(emp.site_visits) || emp.site_visits.length === 0) {
        return
      }

      emp.site_visits.forEach((visit: any) => {
        if (!visit) return

        // Apply date filters
        if (fromDate && toDate) {
          if (visit.visitDate < fromDate || visit.visitDate > toDate) {
            return
          }
        }

        allVisits.push({
          ...visit,
          employee: {
            id: emp.id || '',
            employeeId: emp.employee_id || 'N/A',
            fullName: emp.full_name || 'Unknown Employee',
            department: emp.department || 'N/A',
            position: emp.position || 'N/A',
            phoneNumber: emp.phone_number || 'N/A'
          }
        })
      })
    })

    // Sort by visit date (newest first)
    allVisits.sort((a, b) => {
      if (!a.visitDate || !b.visitDate) return 0
      return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    })

    // Calculate statistics
    const totalVisits = allVisits.length
    const uniqueCompanies = new Set(allVisits.map((v: any) => v.companyName).filter(Boolean)).size
    const uniqueCustomers = new Set(allVisits.map((v: any) => v.customerName).filter(Boolean)).size
    const uniqueEmployees = new Set(allVisits.map((v: any) => v.employee?.employeeId).filter(Boolean)).size
    const visitsWithLocation = allVisits.filter((v: any) => 
      v.liveLocation && (v.liveLocation.latitude || v.liveLocation.longitude)
    ).length

    console.log('📊 Total visits found:', totalVisits)
    console.log('📍 Visits with GPS:', visitsWithLocation)

    return NextResponse.json({
      success: true,
      data: allVisits,
      meta: {
        totalVisits,
        uniqueCompanies,
        uniqueCustomers,
        uniqueEmployees,
        filteredEmployees: employeesData?.length || 0,
        visitsWithLocation
      }
    })

  } catch (error) {
    console.error('❌ Site Visit API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// POST - Add new site visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      employeeId,
      companyName,
      customerName,
      projectName,
      salesPerson,
      visitDate,
      fromTime,
      toTime,
      location,
      followUps,
      notes,
      liveLocation,
    } = body

    console.log('📝 Creating new site visit for employee:', employeeId)

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    if (!companyName || !customerName || !visitDate || !fromTime || !toTime || !location) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find employee by employee_id
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('id, site_visits')
      .eq('employee_id', employeeId)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Generate unique _key
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const siteVisitKey = `visit_${timestamp}_${randomStr}`

    // Prepare liveLocation object
    let locationData = {}
    if (liveLocation && typeof liveLocation === 'object') {
      locationData = {
        latitude: liveLocation.latitude || 0,
        longitude: liveLocation.longitude || 0,
        accuracy: liveLocation.accuracy || 0,
        address: liveLocation.address || '',
        timestamp: liveLocation.timestamp || new Date().toISOString()
      }
    }

    // Create site visit record
    const siteVisit = {
      _key: siteVisitKey,
      _type: 'siteVisit',
      companyName: companyName.trim(),
      customerName: customerName.trim(),
      projectName: projectName ? projectName.trim() : '',
      salesPerson: salesPerson ? salesPerson.trim() : '',
      visitDate,
      fromTime,
      toTime,
      location: location.trim(),
      followUps: followUps ? followUps.trim() : '',
      notes: notes ? notes.trim() : '',
      liveLocation: locationData,
    }

    // Update employee with new site visit
    const currentVisits = employee.site_visits || []
    const updatedVisits = [...currentVisits, siteVisit]

    const { error: updateError } = await supabase
      .from('employees')
      .update({
        site_visits: updatedVisits,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    console.log('✅ Site visit created successfully')

    return NextResponse.json({
      success: true,
      message: 'Site visit recorded successfully',
      data: { id: employee.id, site_visits: updatedVisits },
    })

  } catch (error) {
    console.error('❌ POST Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a site visit
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const visitKey = searchParams.get('visitKey')

    console.log('🗑️ Deleting site visit:', { employeeId, visitKey })

    if (!employeeId || !visitKey) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and Visit Key are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find employee
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('id, site_visits')
      .eq('employee_id', employeeId)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    if (!employee.site_visits || !Array.isArray(employee.site_visits)) {
      return NextResponse.json(
        { success: false, error: 'No site visits found for this employee' },
        { status: 404 }
      )
    }

    const visitExists = employee.site_visits.some((visit: any) => visit._key === visitKey)
    if (!visitExists) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      )
    }

    // Remove the visit
    const updatedVisits = employee.site_visits.filter(
      (visit: any) => visit._key !== visitKey
    )

    const { error: updateError } = await supabase
      .from('employees')
      .update({
        site_visits: updatedVisits,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    console.log('✅ Site visit deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Site visit deleted successfully',
      data: { id: employee.id, site_visits: updatedVisits },
    })

  } catch (error) {
    console.error('❌ DELETE Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}