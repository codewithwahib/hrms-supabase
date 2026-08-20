// src/app/api/site-visit-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// ✅ Force dynamic rendering to fix build error
export const dynamic = 'force-dynamic'

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || '',
  useCdn: false,
})

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

    const query = `*[_type == "employee" && personalDetails.employeeId == $employeeId][0]{
      _id,
      personalDetails {
        employeeId,
        fullName,
        department,
        position,
        fatherName,
        cnic,
        phoneNumber,
        email,
        address,
        joiningDate,
        dob,
        maritalStatus,
        emergencyContact
      },
      enableSiteVisits,
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

    const data = await sanityClient.fetch(query, { employeeId })

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      enabled: data.enableSiteVisits || false
    })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}