// src/app/api/attendance/reset/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params

    console.log('🔄 Resetting attendance for employee:', employeeId)

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required',
        },
        { status: 400 }
      )
    }

    // Find employee with their check-in and check-out records
    const employee = await client.fetch(
      `*[
        _type == "employee" &&
        personalDetails.employeeId == $employeeId
      ][0]{
        _id,
        _type,
        checkIn,
        checkOut,
        personalDetails
      }`,
      { employeeId }
    )

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee not found: ${employeeId}`,
        },
        { status: 404 }
      )
    }

    console.log('📋 Found employee:', employee.personalDetails?.fullName || employeeId)
    console.log('📋 Current check-ins:', employee.checkIn?.length || 0)
    console.log('📋 Current check-outs:', employee.checkOut?.length || 0)

    const today = new Date().toISOString().split('T')[0]
    console.log('📅 Today\'s date:', today)

    // Filter out today's check-in records
    const updatedCheckIn = employee.checkIn?.filter(
      (record: any) => {
        if (!record || !record.time) return true
        const recordDate = record.time.split('T')[0]
        return recordDate !== today
      }
    ) || []

    // Filter out today's check-out records
    const updatedCheckOut = employee.checkOut?.filter(
      (record: any) => {
        if (!record || !record.time) return true
        const recordDate = record.time.split('T')[0]
        return recordDate !== today
      }
    ) || []

    const removedCheckIns = (employee.checkIn?.length || 0) - updatedCheckIn.length
    const removedCheckOuts = (employee.checkOut?.length || 0) - updatedCheckOut.length

    console.log(`🗑️ Removing ${removedCheckIns} check-in records and ${removedCheckOuts} check-out records for today`)

    // Update employee document with filtered arrays
    const updatedEmployee = await client
      .patch(employee._id)
      .set({
        checkIn: updatedCheckIn,
        checkOut: updatedCheckOut,
      })
      .commit()

    console.log('✅ Attendance reset successfully for employee:', employeeId)
    console.log('✅ Updated check-ins:', updatedCheckIn.length)
    console.log('✅ Updated check-outs:', updatedCheckOut.length)

    return NextResponse.json({
      success: true,
      message: 'Attendance reset successfully',
      data: {
        employeeId,
        removedCheckIns,
        removedCheckOuts,
        updatedCheckInCount: updatedCheckIn.length,
        updatedCheckOutCount: updatedCheckOut.length,
        today,
      },
    })

  } catch (error) {
    console.error('❌ Reset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset attendance',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}