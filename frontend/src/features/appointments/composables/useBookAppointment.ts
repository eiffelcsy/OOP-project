import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { schedulesApi } from '@/services/schedulesApi'

// Type aliases from database
type Clinic = Tables<'clinics'>
type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Custom types for booking flow
type Region = 'Central' | 'North' | 'South' | 'East' | 'North-East' | 'West'
type ClinicType = 'General' | 'Specialist' | 'Polyclinic'

// Booking data interface
interface BookingData {
  clinic: Clinic | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
}

// TODO: Implement API service for backend communication
// import { apiService } from '@/services/api'

/**
 * API Integration Plan for BookAppointment Feature
 * 
 * This composable contains placeholder methods for backend API integration.
 * All API methods are currently commented out and use dummy data.
 * 
 * Required Backend Endpoints (to be defined in the Patient Controller):
 * 1. GET /api/patient/clinics - Fetch all clinics
 * 2. GET /api/patient/clinics/:id/doctors - Fetch doctors for a specific clinic
 * 3. GET /api/patient/doctors/:id/available-slots?date=YYYY-MM-DD - Fetch available time slots
 * 4. POST /api/patient/appointments - Create a new appointment booking
 * 
 * To integrate with backend:
 * 1. Uncomment the API service import
 * 2. Uncomment the placeholder API methods (fetchClinics, fetchDoctorsByClinic, etc.)
 * 3. Uncomment the data loading methods (loadClinics, loadDoctorsForClinic, etc.)
 * 4. Uncomment the API calls in action methods (selectClinic, selectDoctor, etc.)
 * 5. Update the confirmBooking method to use the actual API
 * 6. Add proper error handling and loading states
 * 
 * Current State: Using dummy data for development and testing
 */

export const useBookAppointment = () => {
  // Current step (1-4)
  const currentStep = ref(1)
  
  // Booking data
  const bookingData = ref<BookingData>({
    clinic: null,
    doctor: null,
    date: null,
    timeSlot: null
  })

  // Search and filter states for Step 1
  const clinicSearchQuery = ref('')
  // Use generic strings so we can accept DB values (e.g., 'GENERAL', 'SPECIALIST')
  const selectedClinicType = ref<string>('All')
  const selectedRegion = ref<string>('All')

  // Search and filter states for Step 2 (doctors)
  const doctorSearchQuery = ref('')
  const selectedDoctorSpecialty = ref<string>('All')

  // Dummy data for clinics (using database-aligned structure)
  const allClinics = ref<Clinic[]>([
    {
      id: 1,
      name: 'Singapore General Hospital',
      clinic_type: 'General',
      region: 'Central',
      area: 'Outram Park',
      address_line: 'Outram Road, Singapore 169608',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 2,
      name: 'Tan Tock Seng Hospital',
      clinic_type: 'General',
      region: 'Central',
      area: 'Novena',
      address_line: '11 Jalan Tan Tock Seng, Singapore 308433',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 3,
      name: 'National University Hospital',
      clinic_type: 'General',
      region: 'West',
      area: 'Kent Ridge',
      address_line: '5 Lower Kent Ridge Road, Singapore 119074',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 4,
      name: 'Mount Elizabeth Hospital',
      clinic_type: 'Specialist',
      region: 'Central',
      area: 'Orchard',
      address_line: '3 Mount Elizabeth, Singapore 228510',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 5,
      name: 'KK Women\'s and Children\'s Hospital',
      clinic_type: 'Specialist',
      region: 'Central',
      area: 'Outram Park',
      address_line: '100 Bukit Timah Road, Singapore 229899',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 6,
      name: 'Changi General Hospital',
      clinic_type: 'General',
      region: 'East',
      area: 'Simei',
      address_line: '2 Simei Street 3, Singapore 529889',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 7,
      name: 'Khoo Teck Puat Hospital',
      clinic_type: 'General',
      region: 'North',
      area: 'Yishun',
      address_line: '90 Yishun Central, Singapore 768828',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 8,
      name: 'Ng Teng Fong General Hospital',
      clinic_type: 'General',
      region: 'West',
      area: 'Jurong East',
      address_line: '1 Jurong East Street 21, Singapore 609606',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    }
  ])

  // Dummy data for doctors (using database-aligned structure)
  const allDoctors = ref<Doctor[]>([
    {
      id: 1,
      name: 'Dr. Sarah Lim',
      specialty: 'General Medicine',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Dr. Michael Tan',
      specialty: 'Cardiology',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Dr. Jennifer Wong',
      specialty: 'Internal Medicine',
      clinic_id: 2,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Dr. David Chen',
      specialty: 'Emergency Medicine',
      clinic_id: 2,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Dr. Rachel Lee',
      specialty: 'Family Medicine',
      clinic_id: 3,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Dr. Andrew Ng',
      specialty: 'Orthopedics',
      clinic_id: 4,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      name: 'Dr. Michelle Teo',
      specialty: 'Pediatrics',
      clinic_id: 5,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 8,
      name: 'Dr. Kevin Lau',
      specialty: 'General Surgery',
      clinic_id: 6,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])

  // Available time slots (using database-aligned structure)
  const availableTimeSlots = ref<TimeSlot[]>([
    { id: 1, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T09:00:00+08:00', slot_end: '2024-01-01T09:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T09:30:00+08:00', slot_end: '2024-01-01T10:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:00:00+08:00', slot_end: '2024-01-01T10:30:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:30:00+08:00', slot_end: '2024-01-01T11:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:00:00+08:00', slot_end: '2024-01-01T11:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:30:00+08:00', slot_end: '2024-01-01T12:00:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:00:00+08:00', slot_end: '2024-01-01T14:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:30:00+08:00', slot_end: '2024-01-01T15:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 9, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:00:00+08:00', slot_end: '2024-01-01T15:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 10, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:30:00+08:00', slot_end: '2024-01-01T16:00:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 11, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:00:00+08:00', slot_end: '2024-01-01T16:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 12, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:30:00+08:00', slot_end: '2024-01-01T17:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ])

  // Computed slots for the selected doctor/date (array of { start, end, display, booked? })
  const scheduleSlots = ref<Array<{ start: string; end: string; display: string; booked?: boolean }>>([])
  // Appointments fetched for the currently-selected doctor (used to mark slots as booked)
  const fetchedAppointments = ref<any[]>([])

  // TODO: Replace dummy data with actual API calls
  // Placeholder API methods for backend communication
  /*
  const fetchAllClinics = async (): Promise<Clinic[]> => {
    try {
      // TODO: Implement actual API call to fetch ALL clinics (no filters)
      // Client-side filtering is better for user experience
      // const response = await apiService.get('/api/clinics')
      // return response.data
      return allClinics.value // Temporary fallback to dummy data
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
      throw new Error('Failed to load clinics')
    }
  }

  const fetchDoctorsByClinic = async (clinicId: string): Promise<Doctor[]> => {
    try {
      // TODO: Implement actual API call to fetch doctors by clinic ID
      // const response = await apiService.get(`/api/clinics/${clinicId}/doctors`)
      // return response.data
      return allDoctors.value.filter(doctor => doctor.clinicId === clinicId) // Temporary fallback
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      throw new Error('Failed to load doctors')
    }
  }

  const fetchAvailableTimeSlots = async (doctorId: string, date: string): Promise<TimeSlot[]> => {
    try {
      // TODO: Implement actual API call to fetch available time slots
      // const response = await apiService.get(`/api/doctors/${doctorId}/available-slots`, {
      //   params: { date }
      // })
      // return response.data
      return availableTimeSlots.value.filter(slot => slot.available) // Temporary fallback
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
      throw new Error('Failed to load available time slots')
    }
  }

  const bookAppointmentAPI = async (appointmentData: {
    clinicId: string
    doctorId: string
    date: string
    timeSlotId: string
    patientId?: string
  }): Promise<{ success: boolean; appointmentId?: string; message?: string }> => {
    try {
      // TODO: Implement actual API call to book appointment
      // const response = await apiService.post('/api/appointments', appointmentData)
      // return response.data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Temporary success response
      return {
        success: true,
        appointmentId: `apt_${Date.now()}`,
        message: 'Appointment booked successfully'
      }
    } catch (error) {
      console.error('Failed to book appointment:', error)
      return {
        success: false,
        message: 'Failed to book appointment. Please try again.'
      }
    }
  }
  */

  // Computed properties
  const filteredClinics = computed(() => {
    let filtered = allClinics.value

    // Filter by search query
    if (clinicSearchQuery.value) {
      const query = clinicSearchQuery.value.toLowerCase()
      filtered = filtered.filter((clinic: Clinic) => 
        clinic.name.toLowerCase().includes(query) ||
        (clinic.area && clinic.area.toLowerCase().includes(query)) ||
        (clinic.address_line && clinic.address_line.toLowerCase().includes(query))
      )
    }

    // Filter by type (normalize both stored and selected values)
    if (selectedClinicType.value !== 'All') {
      const sel = selectedClinicType.value.toString().trim().toUpperCase()
      filtered = filtered.filter((clinic: Clinic) => ((clinic.clinic_type ?? '').toString().trim().toUpperCase()) === sel)
    }

    // Filter by region (normalize both stored and selected values)
    if (selectedRegion.value !== 'All') {
      const sel = selectedRegion.value.toString().trim().toUpperCase()
      filtered = filtered.filter((clinic: Clinic) => ((clinic.region ?? '').toString().trim().toUpperCase()) === sel)
    }

    return filtered
  })

  const availableDoctors = computed(() => {
    if (!bookingData.value.clinic) return []

    // Base list: doctors for the selected clinic and active
    let doctors = allDoctors.value.filter((doctor: Doctor) => doctor.clinic_id === bookingData.value.clinic?.id && doctor.active)

    // Filter by selected specialty if set
    if (selectedDoctorSpecialty.value && selectedDoctorSpecialty.value !== 'All') {
      const sel = selectedDoctorSpecialty.value.toString().trim().toUpperCase()
      doctors = doctors.filter(d => ((d.specialty ?? '').toString().trim().toUpperCase()) === sel)
    }

    // Search by doctor name or specialty
    if (doctorSearchQuery.value) {
      const q = doctorSearchQuery.value.toLowerCase()
      doctors = doctors.filter(d => 
        (d.name ?? '').toString().toLowerCase().includes(q) ||
        (d.specialty ?? '').toString().toLowerCase().includes(q)
      )
    }

    return doctors
  })

  const distinctDoctorSpecialties = computed(() => {
    const s = new Set<string>()
    // If a clinic is selected, only consider doctors for that clinic; otherwise consider none
    const clinicId = bookingData.value.clinic?.id
    if (!clinicId) return ['All']

    allDoctors.value
      .filter(d => d.clinic_id === clinicId && d.active)
      .forEach(d => {
        const t = (d.specialty ?? '')?.toString().trim()
        if (t) s.add(t)
      })

    return ['All', ...Array.from(s)]
  })

  const availableSlots = computed(() => {
    // TODO: Replace with actual API call when backend is ready
    // This should trigger fetchAvailableTimeSlots(doctorId, date) when both doctor and date are selected
    // If we've computed scheduleSlots for the selected doctor/date, show those first
    if (scheduleSlots.value && scheduleSlots.value.length > 0) {
      // map to a shape similar to TimeSlot expected by UI (slot_start, slot_end, id)
      return scheduleSlots.value.map((s, idx) => ({
        id: `sch-${idx}-${s.start.replace(/[: ]/g, '')}`,
        slot_start: `1970-01-01T${s.start}:00`,
        slot_end: `1970-01-01T${s.end}:00`,
        display: s.display,
        booked: (s as any).booked === true
      }))
    }

    if (!bookingData.value.doctor || !bookingData.value.date) return []
    return availableTimeSlots.value.filter((slot: TimeSlot) => 
      slot.status === 'available' && 
      slot.doctor_id === bookingData.value.doctor?.id
    )
  })

  const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!bookingData.value.clinic
      case 2:
        return !!bookingData.value.doctor
      case 3:
        return !!bookingData.value.date && !!bookingData.value.timeSlot
      case 4:
        return true
      default:
        return false
    }
  })

  const isLastStep = computed(() => currentStep.value === 4)
  const isFirstStep = computed(() => currentStep.value === 1)

  // Dynamic lists for UI filters (derive from loaded clinics)
  const distinctClinicTypes = computed(() => {
    const s = new Set<string>()
    allClinics.value.forEach(c => {
      const t = (c.clinic_type ?? '')?.toString().trim().toUpperCase()
      if (t) s.add(t)
    })
    return ['All', ...Array.from(s)]
  })

  const distinctRegions = computed(() => {
    const s = new Set<string>()
    allClinics.value.forEach(c => {
      const r = (c.region ?? '')?.toString().trim().toUpperCase()
      if (r) s.add(r)
    })
    return ['All', ...Array.from(s)]
  })

  // Actions
  const selectClinic = (clinic: Clinic) => {
    // If clicking the same clinic, deselect it
    if (bookingData.value.clinic?.id === clinic.id) {
      bookingData.value.clinic = null
      bookingData.value.doctor = null
      return
    }
    
    bookingData.value.clinic = clinic
    // Reset doctor when clinic changes
    bookingData.value.doctor = null
    
    // Fetch doctors via backend API (preferred). If this fails it will be
    // logged by the fetch method; do not attempt client-side Supabase fallback.
    fetchDoctorsFromBackend(clinic.id).catch(err => {
      console.warn('fetchDoctorsFromBackend failed for clinic', clinic.id, err)
    })
  }

  const selectDoctor = (doctor: Doctor) => {
    bookingData.value.doctor = doctor

    // After selecting a doctor, fetch their schedules from Supabase and log them.
    // We do not wire UI yet; this is for debugging/development per request.
    if (doctor?.id != null) {
      fetchSchedulesFromSupabase(doctor.id).then(() => {
        // If a date is already selected, compute slots for that date
        if (bookingData.value.date) {
          loadSlotsForDate(doctor.id, bookingData.value.date).catch(err => console.warn('loadSlotsForDate failed:', err))
        }
      }).catch(err => console.warn('fetchSchedulesFromSupabase failed:', err))
    }
  }

  const selectDate = (date: DateValue) => {
    bookingData.value.date = date
    // Reset time slot when date changes
    bookingData.value.timeSlot = null
    // When user selects a date, compute available slots for the selected doctor (if any)
    if (bookingData.value.doctor && bookingData.value.doctor.id != null) {
      loadSlotsForDate(bookingData.value.doctor.id, date).catch(err => console.warn('loadSlotsForDate failed:', err))
    }
    
    // TODO: Uncomment when backend is ready
    // If doctor is already selected, load available slots
    // if (bookingData.value.doctor) {
    //   loadAvailableSlots(bookingData.value.doctor.id, date.toString())
    // }
  }

  const selectTimeSlot = (timeSlot: TimeSlot) => {
    // timeSlot can be either a TimeSlot object (from DB) or a simple slot {start,end,display}
    bookingData.value.timeSlot = (timeSlot as any) || null

    // Attempt to normalize slot start/end and log them for debugging
    try {
      let start: string | null = null
      let end: string | null = null

      if (timeSlot == null) {
        start = end = null
      } else if ((timeSlot as any).slot_start || (timeSlot as any).slot_end) {
        // DB TimeSlot object
        start = (timeSlot as any).slot_start || (timeSlot as any).slot_start
        end = (timeSlot as any).slot_end || (timeSlot as any).slot_end
      } else if ((timeSlot as any).start && (timeSlot as any).end) {
        start = (timeSlot as any).start
        end = (timeSlot as any).end
      } else if (typeof timeSlot === 'string') {
        // e.g. "09:00 - 09:15"
        const parts = (timeSlot as string).split('-').map(s => s.trim())
        start = parts[0] ?? null
        end = parts[1] ?? null
      } else if ((timeSlot as any).display) {
        const parts = ((timeSlot as any).display as string).split('-').map((s: string) => s.trim())
        start = parts[0] ?? null
        end = parts[1] ?? null
      }

      console.log('Selected slot start:', start, 'end:', end)
    } catch (e) {
      console.warn('Failed to parse selected slot for logging', e)
    }
  }

  // Helper: compute per-interval slots for a schedule row
  const computeSlotsFromScheduleRow = (row: any) => {
    const start = row.start_time
    const end = row.end_time
    const duration = Number(row.slot_duration_minutes) || 0

    const slots: Array<{ start: string; end: string; display: string }> = []
    if (start && end && duration > 0) {
      const parseToMinutes = (t: string) => {
        const parts = t.split(':').map((p: string) => parseInt(p, 10))
        const hh = parts[0] || 0
        const mm = parts[1] || 0
        return hh * 60 + mm
      }

      const startMin = parseToMinutes(start)
      const endMin = parseToMinutes(end)

      for (let m = startMin; m + duration <= endMin; m += duration) {
        const toHHMM = (mins: number) => {
          const h = Math.floor(mins / 60).toString().padStart(2, '0')
          const mm = (mins % 60).toString().padStart(2, '0')
          return `${h}:${mm}`
        }
        const s = toHHMM(m)
        const e = toHHMM(m + duration)
        slots.push({ start: s, end: e, display: `${s} - ${e}` })
      }
    }

    return slots
  }

  // Load schedules for a doctor and compute slots for a specific date
  const loadSlotsForDate = async (doctorId: number, date: any) => {
    try {
      // get JS weekday number 1 (Mon) - 7 (Sun)
  const jsDate = new Date(String(date))
      const jsDay = jsDate.getDay() // 0 (Sun) - 6 (Sat)
      const dayNum = jsDay === 0 ? 7 : jsDay

      // Fetch schedule rows (this function already returns computed slots too)
      const rows = await fetchSchedulesFromSupabase(doctorId)

      // rows may be scheduleWithSlots or raw schedule rows; normalize
      const matching = (rows ?? []).filter((r: any) => Number(r.day_of_week) === Number(dayNum))

      // For each matching schedule row, compute interval slots and merge
      const mergedSlots: Array<{ start: string; end: string; display: string }> = []
      for (const row of matching) {
        // If row has computed_slots (strings), convert them; otherwise compute
        if (Array.isArray(row.computed_slots) && row.computed_slots.length > 0) {
          row.computed_slots.forEach((s: string) => {
            const parts = s.split('-').map((p: string) => p.trim())
            mergedSlots.push({ start: parts[0], end: parts[1], display: s })
          })
        } else {
          const cs = computeSlotsFromScheduleRow(row)
          cs.forEach(c => mergedSlots.push(c))
        }
      }

      // Optionally dedupe by display and sort by start
      const unique = Array.from(new Map(mergedSlots.map(s => [s.display, s])).values())
      unique.sort((a, b) => a.start.localeCompare(b.start))

      // Annotate slots with `booked` flag by comparing to fetched appointments for this doctor
      const dateStr = bookingData.value.date ? bookingData.value.date.toString() : String(date)

      const overlaps = (slotStartIso: string, slotEndIso: string, appts: any[]) => {
        if (!appts || appts.length === 0) return false
        try {
          const s = new Date(slotStartIso).getTime()
          const e = new Date(slotEndIso).getTime()
          for (const a of appts) {
            const aStartRaw = a.start_time ?? a.startTime ?? a.start
            const aEndRaw = a.end_time ?? a.endTime ?? a.end
            const aStart = new Date(aStartRaw).getTime()
            const aEnd = new Date(aEndRaw).getTime()
            if (isNaN(aStart) || isNaN(aEnd)) continue
            if (aStart < e && aEnd > s) return true
          }
        } catch (e) {
          // ignore
        }
        return false
      }

      const annotated = unique.map(s => {
        try {
          const slotStartIso = new Date(`${dateStr}T${s.start}`).toISOString()
          const slotEndIso = new Date(`${dateStr}T${s.end}`).toISOString()
          const booked = overlaps(slotStartIso, slotEndIso, fetchedAppointments.value)
          return { ...s, booked }
        } catch (e) {
          return { ...s, booked: false }
        }
      })

      scheduleSlots.value = annotated
      console.log(`Computed ${scheduleSlots.value.length} available slots for doctor ${doctorId} on day ${dayNum}`, scheduleSlots.value)
      return scheduleSlots.value
    } catch (err) {
      console.error('loadSlotsForDate error', err)
      scheduleSlots.value = []
      return []
    }
  }

  const nextStep = async () => {
    // When advancing from Step 2 (doctor selected) to Step 3, fetch schedules
    // and appointments for the selected doctor and log them for debugging.
    if (canProceedToNextStep.value && !isLastStep.value) {
      // If we're on step 2 (selecting doctor) and a doctor is selected,
      // fetch schedule rows and appointments and log them to console.
      try {
        const wasOnStep = currentStep.value
        // Advance step immediately so UI state remains consistent
        currentStep.value++

        if (wasOnStep === 2 && bookingData.value.doctor && bookingData.value.doctor.id != null) {
          const doctorId = bookingData.value.doctor.id
          console.log('Next pressed after doctor selection - fetching schedules and appointments for doctorId=', doctorId)

          // Fetch schedules (uses existing helper which already logs details)
          try {
            const schedules = await fetchSchedulesFromSupabase(doctorId)
            console.log(`Schedules for doctor ${doctorId}:`, schedules)
          } catch (schErr) {
            console.warn('Failed to fetch schedules for doctor', doctorId, schErr)
          }

          // Fetch appointments for this doctor: backend-first, then Supabase fallback
          try {
            let appts: any[] = []

            try {
              const env = (import.meta.env as any)
              const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
              const endpoint = `${apiBase.replace(/\/+$/, '')}/staff/appointments?doctorId=${doctorId}`
              console.log('Backend-first: querying appointments endpoint', endpoint)
              const r = await fetch(endpoint, { headers: { Accept: 'application/json' } })

              if (r.ok) {
                const data = await r.json()
                appts = (data ?? []) as any[]
                console.log(`Backend returned ${appts.length} appointments for doctor ${doctorId}:`, appts)
              } else {
                const txt = await r.text().catch(() => '')
                console.warn('Backend returned non-OK for appointments', r.status, txt)
              }
            } catch (backendErr) {
              console.warn('Backend appointments query failed, will fall back to Supabase:', backendErr)
            }

            // If backend gave nothing, fallback to Supabase client-side query
            if (!appts || appts.length === 0) {
              try {
                const apptQ = await supabase
                  .from('appointments')
                  .select('*')
                  .eq('doctor_id', doctorId)

                if (apptQ.error) {
                  console.error('Supabase error querying appointments for doctor', doctorId, apptQ.error)
                } else {
                  appts = (apptQ.data ?? []) as any[]
                  console.log(`Supabase returned ${appts.length} appointments for doctor ${doctorId}:`, appts)
                }
              } catch (serr) {
                console.error('Failed to query Supabase appointments for doctor', doctorId, serr)
              }
            }

            // Final log: what we ended up with
            console.log(`Found ${ (appts ?? []).length } appointments for doctor ${doctorId}:`, appts)
            // persist for UI reconciliation (marking slots as booked)
            fetchedAppointments.value = appts ?? []
          } catch (aerr) {
            console.error('Failed to query appointments for doctor', doctorId, aerr)
          }

          // Also fetch booked time_slots for this doctor (useful to cross-check)
          try {
            const tsQ = await supabase
              .from('time_slots')
              .select('*')
              .eq('doctor_id', doctorId)
              .eq('status', 'booked')

            if (tsQ.error) {
              console.error('Error querying booked time_slots for doctor', doctorId, tsQ.error)
            } else {
              const bookedSlots = (tsQ.data ?? []) as any[]
              console.log(`Found ${bookedSlots.length} booked time_slots for doctor ${doctorId}:`, bookedSlots)
            }
          } catch (tserr) {
            console.error('Failed to query time_slots for doctor', doctorId, tserr)
          }

          // If a date is already selected, compute schedule slots for that date and log them
          if (bookingData.value.date) {
            try {
              const computed = await loadSlotsForDate(doctorId, bookingData.value.date)
              console.log(`Computed available slots for doctor ${doctorId} on ${bookingData.value.date}:`, computed)
            } catch (lsErr) {
              console.warn('Failed to compute slots for date after Next:', lsErr)
            }
          } else {
            console.log('No date selected yet; skipping per-date slot computation')
          }
        }
      } catch (err) {
        console.error('nextStep: unexpected error while advancing step and fetching data', err)
      }
    }
  }

  const previousStep = () => {
    if (!isFirstStep.value) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      currentStep.value = step
    }
  }

  const resetBooking = () => {
    currentStep.value = 1
    bookingData.value = {
      clinic: null,
      doctor: null,
      date: null,
      timeSlot: null
    }
    clinicSearchQuery.value = ''
    selectedClinicType.value = 'All'
    selectedRegion.value = 'All'
  }

  // TODO: Uncomment and implement these methods when backend is ready
  /*
  const loadAllClinics = async () => {
    try {
      // Fetch ALL clinics once - no server-side filtering
      // Client-side filtering provides better UX
      const clinics = await fetchAllClinics()
      allClinics.value = clinics
    } catch (error) {
      console.error('Failed to load clinics:', error)
      // Handle error (show toast, etc.)
    }
  }

  const loadDoctorsForClinic = async (clinicId: string) => {
    try {
      const doctors = await fetchDoctorsByClinic(clinicId)
      // Update the doctors list for the specific clinic
      allDoctors.value = allDoctors.value.filter(d => d.clinicId !== clinicId).concat(doctors)
    } catch (error) {
      console.error('Failed to load doctors:', error)
      // Handle error (show toast, etc.)
    }
  }

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    try {
      const slots = await fetchAvailableTimeSlots(doctorId, date)
      availableTimeSlots.value = slots
    } catch (error) {
      console.error('Failed to load time slots:', error)
      // Handle error (show toast, etc.)
    }
  }
  */

  // Fetch doctors via backend API (preferred).
  const fetchDoctorsFromBackend = async (clinicId: number) => {
    try {
      const env = (import.meta.env as any)
      const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
      const endpoint = `${apiBase.replace(/\/+$/, '')}/doctors/clinic/${clinicId}`

      console.log('fetchDoctorsFromBackend: requesting', endpoint)
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } })
      if (!res.ok) {
        console.warn('fetchDoctorsFromBackend: backend responded with', res.status)
        return [] as Doctor[]
      }

      const data = await res.json()
      const doctorsFromApi = (data ?? []) as Doctor[]
      console.log(`fetchDoctorsFromBackend: got ${doctorsFromApi.length} doctors for clinic ${clinicId} from backend`, doctorsFromApi)

      if (doctorsFromApi.length > 0) {
        // Merge into local list
        allDoctors.value = allDoctors.value.filter(d => d.clinic_id !== clinicId).concat(doctorsFromApi)
        return doctorsFromApi
      }

  // If backend returned empty array, return empty array
  return [] as Doctor[]
    } catch (err) {
      console.error('fetchDoctorsFromBackend error for clinic', clinicId, err)
      return [] as Doctor[]
    }
  }

  // Fetch schedules for a doctor from Supabase and compute slot timings
  const fetchSchedulesFromSupabase = async (doctorId: number) => {
    try {
      console.log('fetchSchedulesFromSupabase: attempting to load schedules via backend API for doctorId=', doctorId)

      // First try: backend API (admin endpoint used by doctor-management pages)
      try {
        const apiData = await schedulesApi.getSchedulesByDoctorId(doctorId)
        console.log(`schedulesApi returned ${apiData?.length ?? 0} rows for doctor ${doctorId}:`, apiData)

        if (apiData && apiData.length > 0) {
          // Map API response shape (camelCase) to DB-style fields expected below
          const rows = apiData.map(r => ({
            ...r,
            start_time: (r as any).startTime ?? (r as any).start_time,
            end_time: (r as any).endTime ?? (r as any).end_time,
            slot_duration_minutes: (r as any).slotDurationMinutes ?? (r as any).slot_duration_minutes,
            day_of_week: (r as any).dayOfWeek ?? (r as any).day_of_week
          })) as any[]

          // compute slots
          const scheduleWithSlots = rows.map(row => {
            const start = row.start_time
            const end = row.end_time
            const duration = Number(row.slot_duration_minutes) || 0
            const dayNum = Number(row.day_of_week) || 0

            const slots: string[] = []
            if (start && end && duration > 0) {
              const parseToMinutes = (t: string) => {
                const parts = t.split(':').map((p: string) => parseInt(p, 10))
                const hh = parts[0] || 0
                const mm = parts[1] || 0
                return hh * 60 + mm
              }

              const startMin = parseToMinutes(start)
              const endMin = parseToMinutes(end)

              for (let m = startMin; m + duration <= endMin; m += duration) {
                const toHHMM = (mins: number) => {
                  const h = Math.floor(mins / 60).toString().padStart(2, '0')
                  const mm = (mins % 60).toString().padStart(2, '0')
                  return `${h}:${mm}`
                }
                slots.push(`${toHHMM(m)} - ${toHHMM(m + duration)}`)
              }
            }

            return {
              ...row,
              day_name: dayNum ? weekday(dayNum) : null,
              computed_slots: slots
            }
          })

          console.log('Computed schedules with slots (from API):', scheduleWithSlots)
          return scheduleWithSlots
        }
      } catch (apiErr) {
        console.warn('schedulesApi.getSchedulesByDoctorId failed, will fall back to Supabase DB query:', apiErr)
      }

      console.log('fetchSchedulesFromSupabase: querying Supabase directly for doctorId=', doctorId)

      // Fallback: query Supabase directly (try numeric and string equality)
      const q1 = await supabase
        .from('schedules')
        .select('*', { count: 'exact' })
        .eq('doctor_id', doctorId)

      if (q1.error) console.error('Supabase schedules numeric query error', q1.error)
      const rows1 = (q1.data ?? []) as any[]
      console.log(`Fetched ${rows1.length} schedule rows for doctor ${doctorId} (numeric eq):`, rows1)

      const q2 = await supabase
        .from('schedules')
        .select('*', { count: 'exact' })
        .eq('doctor_id', String(doctorId) as any)

      if (q2.error) console.error('Supabase schedules string query error', q2.error)
      const rows2 = (q2.data ?? []) as any[]
      console.log(`Fetched ${rows2.length} schedule rows for doctor ${doctorId} (string eq):`, rows2)

      const rows = rows1.length > 0 ? rows1 : rows2
      if (rows.length > 0) {
        const scheduleWithSlots = rows.map(row => {
          const start = row.start_time
          const end = row.end_time
          const duration = Number(row.slot_duration_minutes) || 0
          const dayNum = Number(row.day_of_week) || 0

          const slots: string[] = []
          if (start && end && duration > 0) {
            const parseToMinutes = (t: string) => {
              const parts = t.split(':').map((p: string) => parseInt(p, 10))
              const hh = parts[0] || 0
              const mm = parts[1] || 0
              return hh * 60 + mm
            }

            const startMin = parseToMinutes(start)
            const endMin = parseToMinutes(end)

            for (let m = startMin; m + duration <= endMin; m += duration) {
              const toHHMM = (mins: number) => {
                const h = Math.floor(mins / 60).toString().padStart(2, '0')
                const mm = (mins % 60).toString().padStart(2, '0')
                return `${h}:${mm}`
              }
              slots.push(`${toHHMM(m)} - ${toHHMM(m + duration)}`)
            }
          }

          return {
            ...row,
            day_name: dayNum ? weekday(dayNum) : null,
            computed_slots: slots
          }
        })

        console.log('Computed schedules with slots (from Supabase):', scheduleWithSlots)
        return scheduleWithSlots
      }

      // Final fallback: show a sample of schedules to help debugging
      const sampleQ = await supabase.from('schedules').select('*').limit(50)
      if (sampleQ.error) console.error('Supabase schedules sample query error', sampleQ.error)
      const sampleRows = (sampleQ.data ?? []) as any[]
      console.warn('Schedules table sample (first 50 rows):', sampleRows)
      return [] as any[]

      // Helper to map day_of_week (1-7) to name
      // Declared as a function so it's hoisted and safe to use above
      function weekday(n: number) {
        const names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        return names[(n - 1 + 7) % 7]
      }

      // Compute slot intervals for each schedule row
      const scheduleWithSlots = rows.map(row => {
        const start = row.start_time // expected 'HH:MM:SS' or 'HH:MM'
        const end = row.end_time
        const duration = Number(row.slot_duration_minutes) || 0
        const dayNum = Number(row.day_of_week) || 0

        const slots: string[] = []
        if (start && end && duration > 0) {
          // parse times into minutes since midnight
          const parseToMinutes = (t: string) => {
            const parts = t.split(':').map((p: string) => parseInt(p, 10))
            const hh = parts[0] || 0
            const mm = parts[1] || 0
            return hh * 60 + mm
          }

          const startMin = parseToMinutes(start)
          const endMin = parseToMinutes(end)

          for (let m = startMin; m + duration <= endMin; m += duration) {
            const toHHMM = (mins: number) => {
              const h = Math.floor(mins / 60).toString().padStart(2, '0')
              const mm = (mins % 60).toString().padStart(2, '0')
              return `${h}:${mm}`
            }
            slots.push(`${toHHMM(m)} - ${toHHMM(m + duration)}`)
          }
        }

          return {
            ...row,
            day_name: dayNum ? weekday(dayNum) : null,
            computed_slots: slots
          }
      })

      console.log('Computed schedules with slots:', scheduleWithSlots)
      return scheduleWithSlots
    } catch (err: any) {
      console.error('Error fetching schedules from Supabase for doctor', doctorId, err)
      return [] as any[]
    }
  }

  // New: load clinics from backend API
  const loadClinics = async () => {
    try {
      // Resolve API base from Vite env (works in dev and production)
      const env = (import.meta.env as any)
      const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
      const endpoint = `${apiBase.replace(/\/+$/, '')}/patient/clinics`

      console.log('loadClinics: requesting endpoint', endpoint)
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } })
      if (!res.ok) {
        // capture response body for easier debugging
        let bodyText = ''
        try {
          bodyText = await res.text()
        } catch (e) {
          bodyText = `<unable to read response body: ${String(e)}>`
        }
        console.error(`loadClinics: backend responded with HTTP ${res.status}`, { endpoint, status: res.status, body: bodyText })
        throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 1000)}`)
      }

      const contentType = (res.headers.get('content-type') || '')
      if (!contentType.includes('application/json')) {
        // Received HTML or other unexpected response (commonly index.html from dev server)
        const text = await res.text()
        console.error('loadClinics: Expected JSON from clinics endpoint but got non-JSON response', { endpoint, contentType, sample: text.slice(0, 2000) })
        throw new Error('Invalid JSON response from clinics endpoint')
      }

      const data: Clinic[] = await res.json()
      console.log('Loaded clinics from backend:', data)
      // Map backend fields to the expected client shape if necessary
      allClinics.value = data.map(c => {
        const raw = c as any
        const safeDate = (val: any) => {
          if (!val) return null
          const ts = Date.parse(val)
          return isNaN(ts) ? null : new Date(ts).toISOString()
        }

        return ({
          id: raw.id,
          name: raw.name,
          // backend returns snake_case column names per DB types
          clinic_type: raw.clinic_type ?? 'General',
          region: raw.region ?? null,
          area: raw.area ?? null,
          address_line: raw.address_line ?? '',
          source_ref: raw.source_ref ?? null,
          remarks: raw.remarks ?? null,
          created_at: safeDate(raw.created_at),
          updated_at: safeDate(raw.updated_at),
          open_time: null,
          close_time: null,
          note: raw.note ?? null
        } as Clinic)
      })
    } catch (error) {
      console.error('Failed to load clinics from backend, using dummy data. Error:', error)
    }
  }

  // Load clinics proactively so UI shows real data when available
  loadClinics().catch(err => {
    // More detailed log already emitted inside loadClinics; keep a short notice here as well
    console.warn('loadClinics failed (see previous logs for details):', err)
  })

  const confirmBooking = async () => {
    try {
      // Use backend API to create appointment using start_time/end_time
      /*
      if (!bookingData.value.clinic || !bookingData.value.doctor || 
          !bookingData.value.date || !bookingData.value.timeSlot) {
        throw new Error('Missing required booking information')
      }

      const appointmentData = {
        clinicId: bookingData.value.clinic.id,
        doctorId: bookingData.value.doctor.id,
        date: bookingData.value.date.toString(),
        timeSlotId: bookingData.value.timeSlot.id,
        // TODO: Get actual patient ID from auth context
        patientId: 'current-patient-id'
      }

      const result = await bookAppointmentAPI(appointmentData)
      
      if (result.success) {
        console.log('Appointment booked successfully:', result.appointmentId)
        return true
      } else {
        console.error('Booking failed:', result.message)
        return false
      }
      */

      if (!bookingData.value.clinic || !bookingData.value.doctor || !bookingData.value.date) {
        throw new Error('Missing required booking information')
      }

      // Derive start/end from bookingData.timeSlot if available, otherwise from scheduleSlots selection
      let startIso: string | null = null
      let endIso: string | null = null

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

      if (bookingData.value.timeSlot) {
        const ts = bookingData.value.timeSlot as any
        // support different shapes
        if (ts.slot_start && ts.slot_end) {
          startIso = new Date(ts.slot_start).toISOString()
          endIso = new Date(ts.slot_end).toISOString()
        } else if (ts.start && ts.end) {
          // times like '09:00' - combine with date
          const dateStr = bookingData.value.date.toString()
          startIso = new Date(`${dateStr}T${ts.start}`).toISOString()
          endIso = new Date(`${dateStr}T${ts.end}`).toISOString()
        } else if (ts.display) {
          const parts = (ts.display as string).split('-').map(s => s.trim())
          const dateStr = bookingData.value.date.toString()
          startIso = new Date(`${dateStr}T${parts[0]}`).toISOString()
          endIso = new Date(`${dateStr}T${parts[1]}`).toISOString()
        }
      } else if (scheduleSlots.value && scheduleSlots.value.length > 0) {
        // if scheduleSlots present, take the first one or selected index - we expect bookingData.timeSlot was set
        const first = scheduleSlots.value[0]
        const dateStr = bookingData.value.date.toString()
        startIso = new Date(`${dateStr}T${first.start}`).toISOString()
        endIso = new Date(`${dateStr}T${first.end}`).toISOString()
      }

      if (!startIso || !endIso) throw new Error('Unable to determine start/end time for booking')

      // Resolve API base
      const env = (import.meta.env as any)
      const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
      const endpoint = `${apiBase.replace(/\/+$/, '')}/appointments`

      const payload = {
        clinicId: bookingData.value.clinic.id,
        doctorId: bookingData.value.doctor.id,
        patientId: null, // TODO: fill from auth context
        startTime: startIso,
        endTime: endIso,
        treatmentSummary: null
      }

      console.log('Posting appointment to backend:', endpoint, payload)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('Backend returned error creating appointment', res.status, txt)
        return false
      }

      const created = await res.json()
      console.log('Appointment created:', created)
      return true
    } catch (error) {
      console.error('Booking failed:', error)
      return false
    }
  }

  return {
    // State
    currentStep,
    bookingData,
    clinicSearchQuery,
    selectedClinicType,
    selectedRegion,
  doctorSearchQuery,
  selectedDoctorSpecialty,
    
    // Computed
    filteredClinics,
    availableDoctors,
    availableSlots,
    scheduleSlots,
  distinctDoctorSpecialties,
    canProceedToNextStep,
    isLastStep,
    isFirstStep,
    distinctClinicTypes,
    distinctRegions,
    
    // Actions
    selectClinic,
    selectDoctor,
  // doctor filters are reactive; components can bind to them directly
    selectDate,
    selectTimeSlot,
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    confirmBooking
  }
}


