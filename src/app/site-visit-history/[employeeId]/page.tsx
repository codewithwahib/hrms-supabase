// src/app/site-visit-history/[employeeId]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Footer from '@/components/footer'
import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
import { client } from '@/sanity/lib/client'
import NavbarDropdown from '@/app/Navbar/page'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  ChevronUp,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader,
  MapPin,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Building,
  Filter,
  ArrowLeft,
  Phone,
  Briefcase,
  Users,
  FileText,
  Eye,
  History,
  Search,
  Home,
  Lock,
  PowerOff,
  Info,
  Download,
} from 'lucide-react'

// Import Roboto font
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface SiteVisit {
  _key: string
  _type: string
  companyName: string
  customerName: string
  projectName?: string
  salesPerson: string
  visitDate: string
  fromTime: string
  toTime: string
  location: string
  followUps?: string
  notes?: string
}

interface Employee {
  _id: string
  personalDetails: {
    employeeId: string
    fullName: string
    department: string
    position: string
    fatherName?: string
    cnic?: string
    phoneNumber?: string
    email?: string
    address?: string
    joiningDate?: string
    dob?: string
    maritalStatus?: string
    emergencyContact?: string
  }
  enableSiteVisits?: boolean
  siteVisits?: SiteVisit[]
}

export default function SiteVisitHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredVisits, setFilteredVisits] = useState<SiteVisit[]>([])
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)
  const [isSiteVisitEnabled, setIsSiteVisitEnabled] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  
  // Date range filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalCompanies: 0,
    totalCustomers: 0,
    totalProjects: 0,
  })

  // =====================================================
  // formatDateForInput - useCallback
  // =====================================================

  const formatDateForInput = useCallback((date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // =====================================================
  // formatDateForDisplay - useCallback
  // =====================================================

  const formatDateForDisplay = useCallback((dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // formatDate - useCallback
  // =====================================================

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // formatTime - useCallback
  // =====================================================

  const formatTime = useCallback((timeStr: string) => {
    if (!timeStr) return '-'
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':')
      const h = parseInt(hours)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${minutes} ${ampm}`
    }
    return timeStr
  }, [])

  // =====================================================
  // calculateStats - useCallback
  // =====================================================

  const calculateStats = useCallback((visits: SiteVisit[]) => {
    const total = visits.length
    const companies = new Set(visits.map(v => v.companyName)).size
    const customers = new Set(visits.map(v => v.customerName)).size
    const projects = new Set(visits.map(v => v.projectName).filter(Boolean)).size

    setStats({
      totalVisits: total,
      totalCompanies: companies,
      totalCustomers: customers,
      totalProjects: projects,
    })
  }, [])

  // =====================================================
  // applyFilters - useCallback
  // =====================================================

  const applyFilters = useCallback(() => {
    if (!employee?.siteVisits) {
      setFilteredVisits([])
      calculateStats([])
      return
    }

    let filtered = [...employee.siteVisits]

    // Filter by date range
    if (fromDate && toDate) {
      filtered = filtered.filter(visit => {
        return visit.visitDate >= fromDate && visit.visitDate <= toDate
      })
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(visit =>
        visit.companyName?.toLowerCase().includes(term) ||
        visit.customerName?.toLowerCase().includes(term) ||
        visit.projectName?.toLowerCase().includes(term) ||
        visit.location?.toLowerCase().includes(term) ||
        visit.salesPerson?.toLowerCase().includes(term)
      )
    }

    // Sort by visit date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    })

    setFilteredVisits(filtered)
    calculateStats(filtered)
  }, [employee, fromDate, toDate, searchTerm, calculateStats])

  // =====================================================
  // fetchEmployeeData - useCallback
  // =====================================================

  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/site-visit-history?employeeId=${encodeURIComponent(employeeId)}`,
        { method: 'GET', cache: 'no-store' }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load site visit history')
      }

      if (!result.data) {
        throw new Error('Employee data not found')
      }

      setEmployee(result.data)
      
      const enabled = result.data.enableSiteVisits || false
      setIsSiteVisitEnabled(enabled)
      
      console.log('📌 Site visit enabled:', enabled)
      console.log('📌 Total visits:', result.data.siteVisits?.length || 0)

    } catch (err) {
      console.error('Error fetching employee data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load site visit history')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  // =====================================================
  // checkSiteVisitStatus - useCallback with fetchEmployeeData dependency
  // =====================================================

  const checkSiteVisitStatus = useCallback(async () => {
    if (!employeeId) return

    try {
      setCheckingStatus(true)
      setStatusMessage(null)
      
      const response = await fetch(
        `/api/site-visit/status?employeeId=${encodeURIComponent(employeeId)}`,
        { method: 'GET', cache: 'no-store' }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to check status')
      }

      const enabled = result.enabled || false
      setIsSiteVisitEnabled(enabled)
      
      if (enabled) {
        setStatusMessage('✅ Site visits are enabled for your account')
        // Refresh employee data
        await fetchEmployeeData()
      } else {
        setStatusMessage('⛔ Site visits are disabled for your account')
      }

      if (result.data) {
        setEmployee(result.data)
      }

      return enabled

    } catch (err) {
      console.error('Status check error:', err)
      setStatusMessage('⚠️ Could not check status. Please try again.')
      return false
    } finally {
      setCheckingStatus(false)
    }
  }, [employeeId, fetchEmployeeData]) // ✅ Added fetchEmployeeData as dependency

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData()
    }
    // Set default dates to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFromDate(formatDateForInput(firstDay))
    setToDate(formatDateForInput(lastDay))
  }, [employeeId, fetchEmployeeData, formatDateForInput])

  useEffect(() => {
    applyFilters()
  }, [employee, fromDate, toDate, searchTerm, applyFilters])

  // =====================================================
  // TOGGLE EXPAND
  // =====================================================

  const toggleExpand = (key: string) => {
    if (expandedVisit === key) {
      setExpandedVisit(null)
    } else {
      setExpandedVisit(key)
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wider">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // EMPLOYEE NOT FOUND
  // =====================================================

  if (!employee) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Employee Not Found</h3>
          <p className="text-gray-600 tracking-wider">No employee found with ID: {employeeId}</p>
        </div>
      </div>
    )
  }

  // =====================================================
  // ✅ SITE VISITS DISABLED - Show Restricted Page
  // =====================================================

  if (!isSiteVisitEnabled) {
      return (
        <>
          <ProtectedEmployeeRoute allowedRole='employee'>
            <NavbarDropdown />
            <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
              <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-sm p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">
                    Site Visit Disabled
                  </h3>
                  <p className="text-gray-600 mb-4 tracking-wide">
                    Site visit records are not enabled for your account. 
                    Please contact your administrator.
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/${employeeId}`)}
                    className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
            <Footer />
          </ProtectedEmployeeRoute>
        </>
      )
    }

  // =====================================================
  // ✅ SITE VISITS ENABLED - Show Full History
  // =====================================================

  return (
    <>
      <ProtectedEmployeeRoute allowedRole='employee'>
        <NavbarDropdown />
        <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                      Site Visit History
                    </h1>
                    <p className="text-sm text-gray-500 tracking-wider mt-1">
                      {employee.personalDetails?.fullName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium tracking-wider">Employee</span>
                </div>
                <div className="text-base font-semibold text-gray-800 mt-1 tracking-wider truncate">
                  {employee.personalDetails?.fullName}
                </div>
                <div className="text-xs text-gray-500 tracking-wider">ID: {employee.personalDetails?.employeeId}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium tracking-wider">Department</span>
                </div>
                <div className="text-base font-semibold text-gray-800 mt-1 tracking-wider">
                  {employee.personalDetails?.department || 'N/A'}
                </div>
                <div className="text-xs text-gray-500 tracking-wider">{employee.personalDetails?.position || 'N/A'}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium tracking-wider">Contact</span>
                </div>
                <div className="text-base font-semibold text-gray-800 mt-1 tracking-wider">
                  {employee.personalDetails?.phoneNumber || 'N/A'}
                </div>
                <div className="text-xs text-gray-500 tracking-wider">{employee.personalDetails?.cnic || 'N/A'}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium tracking-wider">Total Visits</span>
                </div>
                <div className="text-base font-semibold text-gray-800 mt-1 tracking-wider">
                  {stats.totalVisits}
                </div>
                <div className="text-xs text-gray-500 tracking-wider">Site visits recorded</div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0071BD] tracking-wider">Total Visits</span>
                  <MapPin className="w-4 h-4 text-[#0071BD]" />
                </div>
                <div className="text-2xl font-bold text-[#0071BD] tracking-wider mt-1">{stats.totalVisits}</div>
                <div className="text-xs text-gray-400 tracking-wider">Records</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 tracking-wider">Companies</span>
                  <Building className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-700 tracking-wider mt-1">{stats.totalCompanies}</div>
                <div className="text-xs text-gray-400 tracking-wider">Visited</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 tracking-wider">Customers</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-700 tracking-wider mt-1">{stats.totalCustomers}</div>
                <div className="text-xs text-gray-400 tracking-wider">Met</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-600 tracking-wider">Projects</span>
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-700 tracking-wider mt-1">{stats.totalProjects}</div>
                <div className="text-xs text-gray-400 tracking-wider">Projects</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm p-4 mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-[#0071BD] transition tracking-wider"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 text-black gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wider mb-1">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wider"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wider mb-1">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wider"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wider mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by company, customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wider"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Info */}
            <div className="bg-white shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-[#0071BD]" />
                  <span className="font-medium text-gray-700 tracking-wider">
                    {filteredVisits.length} site visit records found
                  </span>
                  {(fromDate || toDate) && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wider">
                      {formatDateForDisplay(fromDate)} → {formatDateForDisplay(toDate)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 tracking-wider">
                  Showing {filteredVisits.length} of {employee?.siteVisits?.length || 0} total
                </div>
              </div>
            </div>

            {/* Site Visit List */}
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#0071BD]" />
                  <h3 className="text-sm font-semibold text-gray-800 tracking-wider">
                    Visit Records
                  </h3>
                  <span className="text-xs text-gray-400 tracking-wider">
                    {filteredVisits.length} records
                  </span>
                  {(fromDate || toDate) && (
                    <span className="text-xs text-[#0071BD] tracking-wider">
                      (Filtered: {formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)})
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredVisits.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 tracking-wider">No site visit records found</p>
                    <p className="text-xs text-gray-400 mt-1 tracking-wider">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  filteredVisits.map((visit) => {
                    const isExpanded = expandedVisit === visit._key

                    return (
                      <div key={visit._key} className="transition">
                        {/* List Item with Hover */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => toggleExpand(visit._key)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#0071BD] rounded-full flex-shrink-0"></div>
                                <h3 className="font-semibold text-gray-800 tracking-wider truncate">
                                  {visit.companyName || 'Unknown Company'}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1 tracking-wider">
                                  <Users className="w-3 h-3" />
                                  {visit.customerName || 'N/A'}
                                </span>
                                {visit.projectName && (
                                  <span className="flex items-center gap-1 tracking-wider">
                                    <FileText className="w-3 h-3" />
                                    {visit.projectName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 tracking-wider">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(visit.visitDate)}
                                </span>
                                <span className="flex items-center gap-1 tracking-wider">
                                  <MapPin className="w-3 h-3" />
                                  {visit.location || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 tracking-wider">
                                {formatTime(visit.fromTime)} - {formatTime(visit.toTime)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Company Name</p>
                                <p className="font-medium text-gray-800 tracking-wider">{visit.companyName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Customer Name</p>
                                <p className="font-medium text-gray-800 tracking-wider">{visit.customerName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Project Name</p>
                                <p className="font-medium text-gray-800 tracking-wider">{visit.projectName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Sales Person</p>
                                <p className="font-medium text-gray-800 tracking-wider">{visit.salesPerson || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Visit Date</p>
                                <p className="font-medium text-gray-800 tracking-wider">{formatDateForDisplay(visit.visitDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">Visit Location</p>
                                <p className="font-medium text-gray-800 tracking-wider">{visit.location || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">From Time</p>
                                <p className="font-medium text-gray-800 tracking-wider">{formatTime(visit.fromTime)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 tracking-wider">To Time</p>
                                <p className="font-medium text-gray-800 tracking-wider">{formatTime(visit.toTime)}</p>
                              </div>
                            </div>

                            {visit.followUps && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 tracking-wider">Follow-Ups</p>
                                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 border border-gray-200 tracking-wider">
                                  {visit.followUps}
                                </p>
                              </div>
                            )}

                            {visit.notes && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 tracking-wider">Visit Notes</p>
                                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 border border-gray-200 tracking-wider">
                                  {visit.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            {filteredVisits.length > 0 && (
              <div className="mt-6 bg-white shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wider">
                  <div className="tracking-wider">
                    Showing {filteredVisits.length} records for {employee.personalDetails?.fullName}
                    {(fromDate || toDate) && ` (${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)})`}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-2 tracking-wider">
                      <span className="w-3 h-3 bg-[#0071BD] rounded"></span>
                      Total: {stats.totalVisits}
                    </span>
                    <span className="flex items-center gap-2 tracking-wider">
                      <span className="w-3 h-3 bg-green-500 rounded"></span>
                      Companies: {stats.totalCompanies}
                    </span>
                    <span className="flex items-center gap-2 tracking-wider">
                      <span className="w-3 h-3 bg-blue-500 rounded"></span>
                      Customers: {stats.totalCustomers}
                    </span>
                    <span className="flex items-center gap-2 tracking-wider">
                      <span className="w-3 h-3 bg-purple-500 rounded"></span>
                      Projects: {stats.totalProjects}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </ProtectedEmployeeRoute>
    </>
  )
}