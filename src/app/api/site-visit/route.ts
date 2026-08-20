// src/app/api/site-visit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || '',
  useCdn: false,
})

// GET - Fetch employee by ID with enableSiteVisits field
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')

    console.log('🔍 Fetching employee:', employeeId)

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // ✅ IMPORTANT: Include enableSiteVisits in the query
    const query = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
      _id,
      personalDetails {
        employeeId,
        fullName,
        department,
        position,
        phoneNumber,
        email
      },
      enableSiteVisits,  // ✅ This field must be included
      siteVisits[] {
        _key,
        _type,
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
        liveLocation {
          latitude,
          longitude,
          accuracy,
          address,
          timestamp
        }
      }
    }`

    const employee = await sanityClient.fetch(query, { employeeId })

    console.log('📊 Employee found:', employee ? 'Yes' : 'No')
    console.log('📌 enableSiteVisits value:', employee?.enableSiteVisits)

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee,
      // ✅ Explicitly return enableSiteVisits status
      enabled: employee.enableSiteVisits || false
    })

  } catch (error) {
    console.error('❌ Error fetching employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// POST - Create site visit
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

    console.log('📝 Creating site visit for employee:', employeeId)

    // Validate required fields
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

    // ✅ Check if employee exists and has site visits enabled
    const checkQuery = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
      _id,
      personalDetails,
      enableSiteVisits
    }`

    const employee = await sanityClient.fetch(checkQuery, { employeeId })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // ✅ Check if site visits are enabled
    if (employee.enableSiteVisits !== true) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Site visits are disabled for your account. Please contact HR.' 
        },
        { status: 403 }
      )
    }

    // Generate unique _key
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const siteVisitKey = `visit_${timestamp}_${randomStr}`

    // Prepare liveLocation
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

    // Create site visit
    const siteVisit = {
      _key: siteVisitKey,
      _type: 'siteVisit',
      companyName: companyName.trim(),
      customerName: customerName.trim(),
      projectName: projectName ? projectName.trim() : '',
      salesPerson: salesPerson ? salesPerson.trim() : employee.personalDetails.fullName || '',
      visitDate,
      fromTime,
      toTime,
      location: location.trim(),
      followUps: followUps ? followUps.trim() : '',
      notes: notes ? notes.trim() : '',
      liveLocation: locationData,
    }

    // Update employee
    const updatedEmployee = await sanityClient
      .patch(employee._id)
      .setIfMissing({ siteVisits: [] })
      .append('siteVisits', [siteVisit])
      .commit()

    console.log('✅ Site visit created successfully')

    return NextResponse.json({
      success: true,
      message: 'Site visit recorded successfully',
      data: updatedEmployee,
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