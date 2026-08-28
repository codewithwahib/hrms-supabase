// components/ProtectedRoute.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Roboto } from 'next/font/google'
import { Loader } from 'lucide-react'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUser: 'hr' | 'admin'
}

export default function ProtectedRoute({
  children,
  allowedUser,
}: ProtectedRouteProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkAuth = () => {
      try {
        // ✅ Check localStorage for user data
        const userDataRaw = localStorage.getItem('hrms_user')

        if (!userDataRaw) {
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/hr/login')
          return
        }

        let userData
        try {
          userData = JSON.parse(userDataRaw)
        } catch (error) {
          console.error('Invalid user data:', error)
          localStorage.removeItem('hrms_user')
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/hr/login')
          return
        }

        // ✅ Check if user has the correct role
        if (userData.role !== allowedUser) {
          console.error('Invalid role:', userData.role)
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/hr/login')
          return
        }

        // ✅ User is authorized
        if (!cancelled) {
          setAuthorized(true)
          setLoading(false)
        }

      } catch (error) {
        console.error('ProtectedRoute error:', error)
        localStorage.removeItem('hrms_user')
        if (!cancelled) {
          setAuthorized(false)
          setLoading(false)
        }
        router.replace('/hr/login')
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [router, allowedUser])

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
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