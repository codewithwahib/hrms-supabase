// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import { Loader } from 'lucide-react'

// interface Props {
//   children: React.ReactNode
//   allowedRole?: 'employee' | 'hr'
// }

// export default function ProtectedEmployeeRoute({
//   children,
//   allowedRole = 'employee',
// }: Props) {
//   const router = useRouter()
//   const pathname = usePathname()

//   const [loading, setLoading] = useState(true)
//   const [authorized, setAuthorized] = useState(false)

//   useEffect(() => {
//     try {
//       const data = localStorage.getItem('employeeData')

//       if (!data) {
//         router.replace('/')
//         return
//       }

//       const user = JSON.parse(data)

//       const employeeIdFromUrl = pathname.split('/').filter(Boolean).pop()

//       if (
//         allowedRole === 'employee' &&
//         user.role === 'employee' &&
//         user.employeeId === employeeIdFromUrl
//       ) {
//         setAuthorized(true)
//       } else {
//         router.replace(`/dashboard/${user.employeeId}`)
//       }
//     } catch (error) {
//       localStorage.removeItem('employeeData')
//       router.replace('/')
//     } finally {
//       setLoading(false)
//     }
//   }, [pathname, router, allowedRole])

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <Loader className="w-10 h-10 animate-spin text-[#0071BD]" />
//       </div>
//     )
//   }

//   if (!authorized) return null

//   return <>{children}</>
// }


'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

interface Props {
  children: React.ReactNode
  allowedRole?: 'employee' | 'hr'
}

interface EmployeeData {
  role?: 'employee' | 'hr'
  employeeId?: string
}

export default function ProtectedEmployeeRoute({
  children,
  allowedRole = 'employee',
}: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkLogin = () => {
      try {
        // ============================================
        // GET LOGIN DATA
        // ============================================

        const employeeDataRaw =
          localStorage.getItem('employeeData')

        const employeeIdRaw =
          localStorage.getItem('employeeId')

        // ============================================
        // IF NO LOGIN DATA
        // ============================================

        if (!employeeDataRaw) {
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }

          router.replace('/')
          return
        }

        // ============================================
        // PARSE EMPLOYEE DATA
        // ============================================

        let employeeData: EmployeeData

        try {
          employeeData = JSON.parse(employeeDataRaw)
        } catch (error) {
          console.error(
            'Invalid employeeData:',
            error
          )

          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')

          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }

          router.replace('/')
          return
        }

        // ============================================
        // GET LOGIN EMPLOYEE ID
        //
        // employeeData.employeeId = PRIMARY
        // localStorage.employeeId = FALLBACK
        // ============================================

        const loginEmployeeId =
          employeeData.employeeId?.trim() ||
          employeeIdRaw?.trim()

        // ============================================
        // ID MISSING
        // ============================================

        if (!loginEmployeeId) {
          console.error(
            'Employee ID not found in login data'
          )

          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')

          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }

          router.replace('/')
          return
        }

        // ============================================
        // ROLE CHECK
        // ============================================

        if (
          allowedRole &&
          employeeData.role !== allowedRole
        ) {
          console.error(
            'Invalid role:',
            employeeData.role
          )

          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }

          router.replace(
            `/dashboard/${loginEmployeeId}`
          )

          return
        }

        // ============================================
        // KEEP LOCAL STORAGE ID SYNCED
        // ============================================

        if (
          employeeIdRaw !== loginEmployeeId
        ) {
          localStorage.setItem(
            'employeeId',
            loginEmployeeId
          )
        }

        // ============================================
        // AUTHORIZED
        // ============================================

        if (!cancelled) {
          setAuthorized(true)
          setLoading(false)
        }

        console.log(
          'Protected route login ID:',
          loginEmployeeId
        )

      } catch (error) {
        console.error(
          'ProtectedEmployeeRoute error:',
          error
        )

        localStorage.removeItem(
          'employeeData'
        )

        localStorage.removeItem(
          'employeeId'
        )

        if (!cancelled) {
          setAuthorized(false)
          setLoading(false)
        }

        router.replace('/')
      }
    }

    // Small delay prevents race condition immediately after login
    const timer = setTimeout(() => {
      checkLogin()
    }, 50)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [router, allowedRole])

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-10 h-10 animate-spin text-[#0071BD]" />
      </div>
    )
  }

  // ============================================
  // NOT AUTHORIZED
  // ============================================

  if (!authorized) {
    return null
  }

  // ============================================
  // AUTHORIZED
  // ============================================

  return <>{children}</>
}