// src/app/hr/site-visits/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import NavbarDropdown from '@/components/navbar'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Clock,
  User,
  ChevronUp,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader,
  MapPin,
  ChevronDown,
  Building,
  Filter,
  Phone,
  Users,
  FileText,
  History,
  Search,
  Eye,
  ArrowLeft,
  UserCheck,
  Briefcase,
  TrendingUp,
  Download,
  Trash2,
  Navigation,
  Globe,
  X,
  CheckCircle,
  Link
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
  liveLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    address: string
    timestamp: string
  }
  employee?: {
    _id: string
    employeeId: string
    fullName: string
    department: string
    position: string
    phoneNumber?: string
    email?: string
  } | null
}

interface Meta {
  totalVisits: number
  uniqueCompanies: number
  uniqueCustomers: number
  uniqueEmployees: number
  filteredEmployees: number
}

export default function SiteVisitsPage() {
  const router = useRouter()
  const [visits, setVisits] = useState<SiteVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<Meta>({
    totalVisits: 0,
    uniqueCompanies: 0,
    uniqueCustomers: 0,
    uniqueEmployees: 0,
    filteredEmployees: 0
  })
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)
  
  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandedFilters, setExpandedFilters] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [employeeNames, setEmployeeNames] = useState<{id: string, name: string, department: string}[]>([])
  const [showMap, setShowMap] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null)

  // =====================================================
  // formatDateForDisplay
  // =====================================================

  const formatDateForDisplay = (dateStr: string) => {
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
  }

  // =====================================================
  // formatDate
  // =====================================================

  const formatDate = (dateStr: string) => {
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
  }

  // =====================================================
  // formatTime
  // =====================================================

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-'
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':')
      const h = parseInt(hours)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${minutes} ${ampm}`
    }
    return timeStr
  }

  // =====================================================
  // formatCoordinates
  // =====================================================

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // =====================================================
  // getGoogleMapsLink
  // =====================================================

  const getGoogleMapsLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`
  }

  const getOpenStreetMapLink = (lat: number, lng: number) => {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`
  }

  // =====================================================
  // fetchVisits
  // =====================================================

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let url = '/api/hr/site-visit?'
      if (selectedDepartment && selectedDepartment !== 'all') {
        url += `department=${encodeURIComponent(selectedDepartment)}&`
      }
      if (selectedEmployee && selectedEmployee !== 'all') {
        url += `employeeId=${encodeURIComponent(selectedEmployee)}&`
      }
      if (fromDate) {
        url += `fromDate=${fromDate}&`
      }
      if (toDate) {
        url += `toDate=${toDate}&`
      }

      const response = await fetch(url, { method: 'GET', cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load site visits')
      }

      const visitData = result.data || []
      setVisits(visitData)
      setMeta(result.meta || {
        totalVisits: 0,
        uniqueCompanies: 0,
        uniqueCustomers: 0,
        uniqueEmployees: 0,
        filteredEmployees: 0
      })

      // Extract departments for filter (only from valid employees)
      const depts = new Set<string>()
      visitData.forEach((visit: SiteVisit) => {
        if (visit.employee?.department) {
          depts.add(visit.employee.department)
        }
      })
      setDepartments(Array.from(depts).sort())

      // Extract employees for filter
      const emps = new Map<string, {id: string, name: string, department: string}>()
      visitData.forEach((visit: SiteVisit) => {
        if (visit.employee?.employeeId && visit.employee?.fullName) {
          emps.set(visit.employee.employeeId, {
            id: visit.employee.employeeId,
            name: visit.employee.fullName,
            department: visit.employee.department || ''
          })
        }
      })
      setEmployeeNames(Array.from(emps.values()))

    } catch (err) {
      console.error('❌ Error fetching visits:', err)
      setError(err instanceof Error ? err.message : 'Failed to load site visits')
    } finally {
      setLoading(false)
    }
  }, [selectedDepartment, selectedEmployee, fromDate, toDate])

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    // Set default dates to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFromDate(formatDateForInput(firstDay))
    setToDate(formatDateForInput(lastDay))
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  // =====================================================
  // formatDateForInput
  // =====================================================

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

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
  // DELETE VISIT
  // =====================================================

  const deleteVisit = async (employeeId: string, visitKey: string) => {
    if (!confirm('Are you sure you want to delete this site visit?')) return

    try {
      const response = await fetch(
        `/api/hr/site-visit?employeeId=${employeeId}&visitKey=${visitKey}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete visit')
      }

      fetchVisits()
      setExpandedVisit(null)

    } catch (err) {
      console.error('❌ Error deleting visit:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete visit')
    }
  }

  // =====================================================
  // Location Map Component
  // =====================================================

  const LocationMap = ({ lat, lng, onClose }: { lat: number, lng: number, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-sm max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 tracking-wider">Location Map</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <div className="p-4">
            <div className="aspect-video bg-gray-100 overflow-hidden relative">
              <iframe
                src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={getGoogleMapsLink(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition text-center flex items-center justify-center gap-2 tracking-wider"
              >
                <Navigation className="w-4 h-4" />
                Open in Google Maps
              </a>
              <a
                href={getOpenStreetMapLink(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition text-center flex items-center justify-center gap-2 tracking-wider"
              >
                <Globe className="w-4 h-4" />
                Open in OpenStreetMap
              </a>
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 tracking-wide">
              <strong>Coordinates:</strong> {formatCoordinates(lat, lng)}
            </div>
          </div>
        </div>
      </div>
    )
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
  // RENDER
  // =====================================================

  return (
    <ProtectedRoute allowedUser='hr'>
      <NavbarDropdown />
      <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                    Site Visits
                  </h1>
                  <p className="text-sm text-gray-500 tracking-wider mt-1">
                    {visits.length} visits • {meta.uniqueEmployees} employees
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => fetchVisits()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 tracking-wider"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow-sm p-4">
              <div className="text-sm text-[#0071BD] tracking-wide">Total Visits</div>
              <div className="text-2xl font-bold text-[#0071BD] tracking-wider">{meta.totalVisits}</div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className="text-sm text-green-600 tracking-wide">Employees</div>
              <div className="text-2xl font-bold text-green-700 tracking-wider">{meta.uniqueEmployees}</div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className="text-sm text-blue-600 tracking-wide">Companies</div>
              <div className="text-2xl font-bold text-blue-700 tracking-wider">{meta.uniqueCompanies}</div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className="text-sm text-purple-600 tracking-wide">Customers</div>
              <div className="text-2xl font-bold text-purple-700 tracking-wider">{meta.uniqueCustomers}</div>
            </div>
          </div>

          {/* Filters - Same as Get Sheet */}
          <div className="bg-white text-black shadow-sm p-4 mb-6">
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-[#0071BD] transition tracking-wider"
            >
              <Filter className="w-4 h-4" />
              {expandedFilters ? 'Hide Filters' : 'Show Filters'}
              {expandedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    >
                      <option value="all">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                    Select Employee
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    >
                      <option value="all">All Employees</option>
                      {employeeNames.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.id})
                        </option>
                      ))}
                    </select>
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
                  {visits.length} site visit records found
                </span>
                {(fromDate || toDate) && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wider">
                    {formatDateForDisplay(fromDate)} → {formatDateForDisplay(toDate)}
                  </span>
                )}
                {selectedDepartment !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wider">
                    Dept: {selectedDepartment}
                  </span>
                )}
                {selectedEmployee !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wider">
                    Employee Selected
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 tracking-wider">
                Showing {visits.length} of {meta.totalVisits} total
              </div>
            </div>
          </div>

          {/* Site Visit List */}
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="bg-white shadow-sm p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2 tracking-wider">No site visits found</h3>
                <p className="text-gray-400 tracking-wider">Try adjusting your filters</p>
              </div>
            ) : (
              visits.map((visit, index) => {
                const isExpanded = expandedVisit === (visit._key || index.toString())
                const hasLiveLocation = visit.liveLocation && (visit.liveLocation.latitude || visit.liveLocation.longitude)
                // Safe access to employee properties with fallbacks
                const employeeName = visit.employee?.fullName || 'Unknown Employee'
                const employeeId = visit.employee?.employeeId || 'N/A'
                const employeeDepartment = visit.employee?.department || 'N/A'
                const employeePosition = visit.employee?.position || 'N/A'
                const employeePhone = visit.employee?.phoneNumber || 'N/A'
                const employeeEmail = visit.employee?.email || 'N/A'

                return (
                  <div key={visit._key || index} className="bg-white shadow-sm overflow-hidden hover:shadow-md transition">
                    {/* Visit Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => toggleExpand(visit._key || index.toString())}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <MapPin className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate tracking-wider">
                              {visit.companyName || 'Unknown Company'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 tracking-wider">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {employeeName}
                              </span>
                              <span className="w-1 h-1 bg-gray-300"></span>
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {employeeDepartment}
                              </span>
                              <span className="w-1 h-1 bg-gray-300"></span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {visit.customerName || 'N/A'}
                              </span>
                              <span className="w-1 h-1 bg-gray-300"></span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(visit.visitDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 tracking-wider">
                              {formatTime(visit.fromTime)} - {formatTime(visit.toTime)}
                            </span>
                            {hasLiveLocation && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 tracking-wider flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                GPS
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Live Location Preview - Always visible */}
                      {hasLiveLocation && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-gray-500 tracking-wider flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-blue-500" />
                            GPS:
                          </span>
                          <span className="text-gray-700 tracking-wider font-medium">
                            {visit.liveLocation?.latitude?.toFixed(6)}, {visit.liveLocation?.longitude?.toFixed(6)}
                          </span>
                          {visit.liveLocation?.accuracy && (
                            <span className="text-gray-400 tracking-wider">
                              ±{visit.liveLocation.accuracy}m
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (visit.liveLocation?.latitude && visit.liveLocation?.longitude) {
                                setSelectedLocation({
                                  lat: visit.liveLocation.latitude,
                                  lng: visit.liveLocation.longitude
                                })
                                setShowMap(true)
                              }
                            }}
                            className="text-[#0071BD] hover:text-[#005a96] transition tracking-wider flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            View on Map
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <div className="p-4">
                          {/* Employee and Visit Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Employee</p>
                              <p className="font-medium text-gray-800 tracking-wider">{employeeName}</p>
                              <p className="text-xs text-gray-400 tracking-wider">ID: {employeeId}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Department</p>
                              <p className="font-medium text-gray-800 tracking-wider">{employeeDepartment}</p>
                              <p className="text-xs text-gray-400 tracking-wider">{employeePosition}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Contact</p>
                              <p className="font-medium text-gray-800 tracking-wider">{employeePhone}</p>
                              <p className="text-xs text-gray-400 tracking-wider">{employeeEmail}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Company Name</p>
                              <p className="font-medium text-gray-800 tracking-wider">{visit.companyName || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Customer Name</p>
                              <p className="font-medium text-gray-800 tracking-wider">{visit.customerName || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Project Name</p>
                              <p className="font-medium text-gray-800 tracking-wider">{visit.projectName || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Sales Person</p>
                              <p className="font-medium text-gray-800 tracking-wider">{visit.salesPerson || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Visit Date</p>
                              <p className="font-medium text-gray-800 tracking-wider">{formatDateForDisplay(visit.visitDate)}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">Visit Location</p>
                              <p className="font-medium text-gray-800 tracking-wider">{visit.location || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">From Time</p>
                              <p className="font-medium text-gray-800 tracking-wider">{formatTime(visit.fromTime)}</p>
                            </div>
                            <div className="bg-gray-50 p-3">
                              <p className="text-xs text-gray-500 tracking-wider">To Time</p>
                              <p className="font-medium text-gray-800 tracking-wider">{formatTime(visit.toTime)}</p>
                            </div>
                          </div>

                          {/* Live Location - Full Details in Expanded View */}
                          {hasLiveLocation && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 tracking-wider flex items-center gap-2 mb-2">
                                <Navigation className="w-4 h-4 text-blue-500" />
                                Live Location (GPS) - Full Details
                              </p>
                              <div className="bg-blue-50 p-3 border border-blue-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500 tracking-wider">Latitude:</span>
                                    <span className="ml-1 font-medium text-gray-800 tracking-wider">
                                      {visit.liveLocation?.latitude?.toFixed(6) || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 tracking-wider">Longitude:</span>
                                    <span className="ml-1 font-medium text-gray-800 tracking-wider">
                                      {visit.liveLocation?.longitude?.toFixed(6) || 'N/A'}
                                    </span>
                                  </div>
                                  {visit.liveLocation?.accuracy && (
                                    <div>
                                      <span className="text-gray-500 tracking-wider">Accuracy:</span>
                                      <span className="ml-1 font-medium text-gray-800 tracking-wider">
                                        {visit.liveLocation.accuracy} meters
                                      </span>
                                    </div>
                                  )}
                                  {visit.liveLocation?.timestamp && (
                                    <div>
                                      <span className="text-gray-500 tracking-wider">Captured:</span>
                                      <span className="ml-1 font-medium text-gray-800 tracking-wider">
                                        {new Date(visit.liveLocation.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {visit.liveLocation?.address && (
                                    <div className="md:col-span-2">
                                      <span className="text-gray-500 tracking-wider">Address:</span>
                                      <span className="ml-1 font-medium text-gray-800 tracking-wider">
                                        {visit.liveLocation.address}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {visit.liveLocation?.latitude && visit.liveLocation?.longitude && (
                                  <div className="mt-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedLocation({
                                          lat: visit.liveLocation!.latitude,
                                          lng: visit.liveLocation!.longitude
                                        })
                                        setShowMap(true)
                                      }}
                                      className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 tracking-wider text-sm"
                                    >
                                      <Navigation className="w-4 h-4" />
                                      View on Map
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Follow Ups & Notes */}
                          {(visit.followUps || visit.notes) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {visit.followUps && (
                                <div>
                                  <p className="text-xs text-gray-500 tracking-wider">Follow-Ups</p>
                                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 border border-gray-200 tracking-wider">
                                    {visit.followUps}
                                  </p>
                                </div>
                              )}
                              {visit.notes && (
                                <div>
                                  <p className="text-xs text-gray-500 tracking-wider">Visit Notes</p>
                                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 border border-gray-200 tracking-wider">
                                    {visit.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (visit.employee?.employeeId) {
                                  deleteVisit(visit.employee.employeeId, visit._key)
                                } else {
                                  alert('Cannot delete: Employee ID not found')
                                }
                              }}
                              className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2 tracking-wider text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Visit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Stats */}
          {visits.length > 0 && (
            <div className="mt-6 bg-white shadow-sm p-4">
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wider">
                <div>
                  Showing {visits.length} records from {meta.uniqueEmployees} employees
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#0071BD] rounded"></span>
                    Total Visits: {meta.totalVisits}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded"></span>
                    Companies: {meta.uniqueCompanies}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded"></span>
                    Customers: {meta.uniqueCustomers}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded"></span>
                    Employees: {meta.uniqueEmployees}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      {showMap && selectedLocation && (
        <LocationMap 
          lat={selectedLocation.lat} 
          lng={selectedLocation.lng} 
          onClose={() => {
            setShowMap(false)
            setSelectedLocation(null)
          }}
        />
      )}

      <Footer />
    </ProtectedRoute>
  )
}