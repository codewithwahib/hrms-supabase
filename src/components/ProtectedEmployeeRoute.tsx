'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Loader } from 'lucide-react'

interface Props {
  children: React.ReactNode
  allowedRole?: 'employee' | 'hr'
}

interface EmployeeData {
  role?: 'employee' | 'hr'
  employeeId?: string
  fullName?: string
}

export default function ProtectedEmployeeRoute({
  children,
  allowedRole = 'employee',
}: Props) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const employeeDataRaw = localStorage.getItem('employeeData')
        const employeeIdRaw = localStorage.getItem('employeeId')

        if (!employeeDataRaw) {
          if (!cancelled) {
            setIsAuthorized(false)
          }
          router.replace('/')
          return
        }

        let employeeData: EmployeeData
        try {
          employeeData = JSON.parse(employeeDataRaw)
        } catch (error) {
          console.error('Invalid employeeData:', error)
          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')
          if (!cancelled) {
            setIsAuthorized(false)
          }
          router.replace('/')
          return
        }

        const loginEmployeeId = employeeData.employeeId?.trim() || employeeIdRaw?.trim()

        if (!loginEmployeeId) {
          console.error('Employee ID not found')
          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')
          if (!cancelled) {
            setIsAuthorized(false)
          }
          router.replace('/')
          return
        }

        // Verify employee exists
        const { data: employee, error: fetchError } = await supabase
          .from('employees')
          .select('employee_id, full_name, department, position')
          .eq('employee_id', loginEmployeeId)
          .maybeSingle()

        if (fetchError || !employee) {
          console.error('Employee verification failed:', fetchError)
          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')
          if (!cancelled) {
            setIsAuthorized(false)
          }
          router.replace('/')
          return
        }

        // Role check
        if (allowedRole && employeeData.role !== allowedRole) {
          console.error('Invalid role:', employeeData.role)
          if (!cancelled) {
            setIsAuthorized(false)
          }
          router.replace(`/dashboard/${loginEmployeeId}`)
          return
        }

        // Authorized
        if (!cancelled) {
          setIsAuthorized(true)
        }

        console.log('✅ Protected route authorized for:', loginEmployeeId)

      } catch (error) {
        console.error('ProtectedEmployeeRoute error:', error)
        localStorage.removeItem('employeeData')
        localStorage.removeItem('employeeId')
        if (!cancelled) {
          setIsAuthorized(false)
        }
        router.replace('/')
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [router, allowedRole, supabase])



  if (!isAuthorized) {
    return null
  }

  // ✅ STEP 2: AUTHORIZED - Children render karo (DashboardContent)
  return <>{children}</>
}