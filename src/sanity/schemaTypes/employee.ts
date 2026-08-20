// schema.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const employee = defineType({
  name: 'employee',
  title: 'Employee Record',
  type: 'document',
  fields: [
    // ✅ Personal Details Section
    defineField({
      name: 'personalDetails',
      title: 'Personal Details',
      type: 'object',
      fields: [
        { 
          name: 'employeeId', 
          title: 'Employee ID', 
          type: 'string', 
          validation: Rule => Rule.required()
        },
        { 
          name: 'fullName', 
          title: 'Full Name', 
          type: 'string', 
          validation: Rule => Rule.required() 
        },
        { 
          name: 'fatherName', 
          title: 'Father Name', 
          type: 'string' 
        },
        { 
          name: 'cnic', 
          title: 'CNIC Number', 
          type: 'string',
          validation: Rule => Rule.required().length(13) 
        },
        { 
          name: 'phoneNumber', 
          title: 'Phone Number', 
          type: 'string',
          validation: Rule => Rule.required() 
        },
        { 
          name: 'emergencyContact', 
          title: 'Emergency Contact', 
          type: 'string' 
        },
        { 
          name: 'dob', 
          title: 'Date of Birth', 
          type: 'date', 
          options: { dateFormat: 'YYYY-MM-DD' } 
        },
        { 
          name: 'maritalStatus', 
          title: 'Marital Status', 
          type: 'string', 
          options: { list: ['Single', 'Married', 'Divorced', 'Widowed'] } 
        },
        { 
          name: 'address', 
          title: 'Residential Address', 
          type: 'text' 
        },
        { 
          name: 'joiningDate', 
          title: 'Joining Date', 
          type: 'date', 
          options: { dateFormat: 'YYYY-MM-DD' } 
        },
        { 
          name: 'department', 
          title: 'Department', 
          type: 'string'
        },
        { 
          name: 'position', 
          title: 'Position/Designation', 
          type: 'string'
        },
        // ✅ CV PDF Field
        { 
          name: 'cv', 
          title: 'CV / Resume (PDF)', 
          type: 'file',
          options: {
            accept: 'application/pdf',
            storeOriginalFilename: true
          },
          description: 'Upload employee CV/Resume in PDF format only',
          fields: [
            {
              name: 'description',
              type: 'string',
              title: 'Description',
              description: 'Optional description of the file'
            }
          ]
        }
      ]
    }),

    // ✅ Qualifications Section
    defineField({
      name: 'qualifications',
      title: 'Qualifications',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { 
              name: 'educationType', 
              title: 'Education Type', 
              type: 'string', 
              options: { list: ['Matric', 'Intermediate', 'Bachelor', 'Master', 'PhD', 'Other'] } 
            },
            { 
              name: 'institute', 
              title: 'Institute Name', 
              type: 'string' 
            },
            { 
              name: 'year', 
              title: 'Year of Passing', 
              type: 'number' 
            },
            { 
              name: 'grade', 
              title: 'Grade/Percentage', 
              type: 'string' 
            }
          ]
        })
      ]
    }),

    // ✅ Experience Section
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { 
              name: 'companyName', 
              title: 'Company Name', 
              type: 'string' 
            },
            { 
              name: 'experience', 
              title: 'Experience (Years)', 
              type: 'number' 
            },
            { 
              name: 'position', 
              title: 'Position Held', 
              type: 'string' 
            },
            { 
              name: 'startDate', 
              title: 'Start Date', 
              type: 'date' 
            },
            { 
              name: 'endDate', 
              title: 'End Date', 
              type: 'date' 
            },
            { 
              name: 'responsibilities', 
              title: 'Key Responsibilities', 
              type: 'text' 
            }
          ]
        })
      ]
    }),

    // ✅ Check-In Section (Only Time & Location)
    defineField({
      name: 'checkIn',
      title: 'Check-In Records',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'checkInRecord',
          fields: [
            { 
              name: 'time', 
              title: 'Check-In Time', 
              type: 'datetime',
              validation: Rule => Rule.required()
            },
            { 
              name: 'location', 
              title: 'Check-In Location', 
              type: 'string',
              validation: Rule => Rule.required()
            }
          ],
          preview: {
            select: {
              title: 'time',
              subtitle: 'location'
            },
            prepare(selection) {
              const { title, subtitle } = selection
              return {
                title: title ? `Check-In: ${new Date(title).toLocaleString()}` : 'Unknown',
                subtitle: subtitle || 'No location'
              }
            }
          }
        })
      ]
    }),

    // ✅ Check-Out Section (Only Time & Location)
    defineField({
      name: 'checkOut',
      title: 'Check-Out Records',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'checkOutRecord',
          fields: [
            { 
              name: 'time', 
              title: 'Check-Out Time', 
              type: 'datetime',
              validation: Rule => Rule.required()
            },
            { 
              name: 'location', 
              title: 'Check-Out Location', 
              type: 'string',
              validation: Rule => Rule.required()
            }
          ],
          preview: {
            select: {
              title: 'time',
              subtitle: 'location'
            },
            prepare(selection) {
              const { title, subtitle } = selection
              return {
                title: title ? `Check-Out: ${new Date(title).toLocaleString()}` : 'Unknown',
                subtitle: subtitle || 'No location'
              }
            }
          }
        })
      ]
    }),

    // ✅ Site Visit Toggle Button
    defineField({
      name: 'enableSiteVisits',
      title: 'Enable Site Visit Records',
      type: 'boolean',
      description: 'Toggle to enable or disable site visit records for this employee',
      initialValue: false,
      options: {
        layout: 'checkbox'
      }
    }),

    // ✅ Site Visit Section with Conditional Display
    defineField({
      name: 'siteVisits',
      title: 'Site Visit Records',
      type: 'array',
      hidden: ({ parent }) => !parent?.enableSiteVisits,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'siteVisit',
          fields: [
            { 
              name: 'companyName', 
              title: 'Company Name', 
              type: 'string',
              validation: Rule => Rule.required()
            },
            { 
              name: 'customerName', 
              title: 'Customer Name', 
              type: 'string',
              validation: Rule => Rule.required()
            },
            { 
              name: 'projectName', 
              title: 'Project Name', 
              type: 'string'
            },
            { 
              name: 'salesPerson', 
              title: 'Sales Person', 
              type: 'string'
            },
            { 
              name: 'visitDate', 
              title: 'Visit Date', 
              type: 'date',
              options: { dateFormat: 'YYYY-MM-DD' },
              validation: Rule => Rule.required()
            },
            { 
              name: 'fromTime', 
              title: 'From Time', 
              type: 'string',
              description: 'e.g., 09:00 AM',
              validation: Rule => Rule.required()
            },
            { 
              name: 'toTime', 
              title: 'To Time', 
              type: 'string',
              description: 'e.g., 05:00 PM',
              validation: Rule => Rule.required()
            },
            { 
              name: 'location', 
              title: 'Visit Location', 
              type: 'string',
              validation: Rule => Rule.required()
            },
            // ✅ Live Location Field
            { 
              name: 'liveLocation', 
              title: 'Live Location', 
              type: 'object',
              description: 'Real-time GPS location during visit',
              fields: [
                { 
                  name: 'latitude', 
                  title: 'Latitude', 
                  type: 'number',
                  validation: Rule => Rule.required().min(-90).max(90)
                },
                { 
                  name: 'longitude', 
                  title: 'Longitude', 
                  type: 'number',
                  validation: Rule => Rule.required().min(-180).max(180)
                },
                { 
                  name: 'accuracy', 
                  title: 'Accuracy (meters)', 
                  type: 'number',
                  description: 'GPS accuracy in meters'
                },
                { 
                  name: 'timestamp', 
                  title: 'Location Timestamp', 
                  type: 'datetime',
                  initialValue: () => new Date().toISOString()
                },
                { 
                  name: 'address', 
                  title: 'Address from GPS', 
                  type: 'text',
                  description: 'Reverse geocoded address'
                }
              ],
              preview: {
                select: {
                  title: 'address',
                  subtitle: 'timestamp'
                },
                prepare(selection) {
                  const { title, subtitle } = selection
                  return {
                    title: title || 'No address available',
                    subtitle: subtitle ? `Captured: ${new Date(subtitle).toLocaleString()}` : 'No timestamp'
                  }
                }
              }
            },
            // ✅ Follow-Ups Section (Simplified like Visit Notes)
            { 
              name: 'followUps', 
              title: 'Follow-Ups', 
              type: 'text',
              description: 'Enter follow-up notes for this site visit'
            },
            { 
              name: 'notes', 
              title: 'Visit Notes', 
              type: 'text',
              description: 'Additional notes about the site visit'
            }
          ],
          preview: {
            select: {
              title: 'companyName',
              subtitle: 'customerName',
              description: 'projectName'
            },
            prepare(selection) {
              const { title, subtitle, description } = selection
              return {
                title: title || 'Unknown Company',
                subtitle: subtitle ? `Customer: ${subtitle}` : 'No customer',
                description: description ? `Project: ${description}` : 'No project'
              }
            }
          }
        })
      ]
    }),

    // ✅ Leaves Section
    defineField({
      name: 'leaves',
      title: 'Leave Requests',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { 
              name: 'employeeName', 
              title: 'Employee Name', 
              type: 'string'
            },
            { 
              name: 'employeeId', 
              title: 'Employee ID', 
              type: 'string'
            },
            { 
              name: 'department', 
              title: 'Department', 
              type: 'string',
              options: {
                list: [
                  'Sales',
                  'Marketing',
                  'HR',
                  'Finance',
                  'IT',
                  'Operations',
                  'Management',
                  'Other'
                ]
              }
            },
            { 
              name: 'position', 
              title: 'Position/Designation', 
              type: 'string'
            },
            { 
              name: 'leaveType', 
              title: 'Leave Type', 
              type: 'string',
              options: {
                list: [
                  'Annual Leave',
                  'Sick Leave',
                  'Casual Leave',
                  'Emergency Leave',
                  'Maternity Leave',
                  'Paternity Leave',
                  'Study Leave',
                  'Unpaid Leave',
                  'Other'
                ]
              }
            },
            { 
              name: 'fromDate', 
              title: 'From Date', 
              type: 'date',
              options: { dateFormat: 'YYYY-MM-DD' }
            },
            { 
              name: 'toDate', 
              title: 'To Date', 
              type: 'date',
              options: { dateFormat: 'YYYY-MM-DD' }
            },
            { 
              name: 'totalDays', 
              title: 'Total Days', 
              type: 'number'
            },
            { 
              name: 'reason', 
              title: 'Reason for Leave', 
              type: 'text'
            },
            { 
              name: 'status', 
              title: 'Status', 
              type: 'string',
              options: {
                list: [
                  { title: 'Pending', value: 'pending' },
                  { title: 'Approved', value: 'approved' },
                  { title: 'Rejected', value: 'rejected' },
                  { title: 'Cancelled', value: 'cancelled' }
                ]
              },
              initialValue: 'pending'
            },
            { 
              name: 'appliedOn', 
              title: 'Applied On', 
              type: 'datetime',
              initialValue: () => new Date().toISOString()
            }
          ],
          preview: {
            select: {
              title: 'leaveType',
              subtitle: 'status',
              description: 'reason'
            },
            prepare(selection) {
              const { title, subtitle, description } = selection
              return {
                title: `${title || 'Leave'} - ${subtitle || 'pending'}`,
                subtitle: description ? description.slice(0, 50) : 'No reason provided'
              }
            }
          }
        })
      ]
    }),

    // ✅ Login Credentials
    defineField({
      name: 'username',
      title: 'Username',
      type: 'string'
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string'
    })
  ],

  preview: {
    select: {
      title: 'personalDetails.fullName',
      subtitle: 'personalDetails.employeeId'
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title: title || 'Unknown Employee',
        subtitle: `ID: ${subtitle || 'N/A'}`
      }
    }
  }
})