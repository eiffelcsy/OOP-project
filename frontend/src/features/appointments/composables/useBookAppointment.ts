import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { schedulesApi } from '@/services/schedulesApi'
import { useAuth } from '@/features/auth/composables/useAuth'
import { toast } from 'vue-sonner'
import { ensureSgtOffset, SGT_OFFSET, hasTz, sgtLocalToUtcIso, utcIsoToSgTime } from '@/lib/utils'

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
  { id: 3, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:00:00+08:00', slot_end: '2024-01-01T10:30:00+08:00', status: 'scheduled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:30:00+08:00', slot_end: '2024-01-01T11:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:00:00+08:00', slot_end: '2024-01-01T11:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:30:00+08:00', slot_end: '2024-01-01T12:00:00+08:00', status: 'scheduled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:00:00+08:00', slot_end: '2024-01-01T14:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:30:00+08:00', slot_end: '2024-01-01T15:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 9, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:00:00+08:00', slot_end: '2024-01-01T15:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 10, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:30:00+08:00', slot_end: '2024-01-01T16:00:00+08:00', status: 'scheduled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 11, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:00:00+08:00', slot_end: '2024-01-01T16:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 12, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:30:00+08:00', slot_end: '2024-01-01T17:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ])

  // Computed slots for the selected doctor/date (array of { start, end, display, booked? })
  const scheduleSlots = ref<Array<{ start: string; end: string; display: string; booked?: boolean }>>([])
  // Appointments fetched for the currently-selected doctor (used to mark slots as booked)
  const fetchedAppointments = ref<any[]>([])
  // Raw schedules fetched (with computed_slots) so calendar can highlight weekdays with availability
  const fetchedSchedules = ref<any[]>([])

  // Computed set of weekday numbers (1=Mon .. 7=Sun) that have at least one computed slot
  const availableWeekdays = computed(() => {
    const s = new Set<number>()
    for (const row of fetchedSchedules.value || []) {
      const day = Number(row.day_of_week) || Number(row.dayOfWeek) || null
      const slots = Array.isArray(row.computed_slots) ? row.computed_slots : []
      if (day && slots.length > 0) s.add(Number(day))
    }
    return s
  })

  // Compute specific available dates (YYYY-MM-DD) for the next N days where doctor has >=1 free slot
  const availableDates = computed(() => {
    const out = new Set<string>()
    const doctorId = bookingData.value.doctor?.id
    if (!doctorId) return out

    const daysAhead = 60
    const today = new Date()
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const jsDay = d.getDay()
      const dayNum = jsDay === 0 ? 7 : jsDay
      // find schedule rows for this weekday
      const rows = (fetchedSchedules.value || []).filter((r: any) => Number(r.day_of_week) === Number(dayNum) || Number(r.dayOfWeek) === Number(dayNum))
      if (!rows || rows.length === 0) continue

  // Use Singapore local date string (YYYY-MM-DD) to avoid timezone shifting
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }) // e.g. "2025-10-27"

      let dateHasFree = false
      for (const row of rows) {
        // get slots for this row
        const slots = Array.isArray(row.computed_slots) && row.computed_slots.length > 0
          ? row.computed_slots.map((s: string) => {
              const parts = s.split('-').map((p: string) => p.trim())
              return { start: parts[0], end: parts[1], display: s }
            })
          : computeSlotsFromScheduleRow(row)

        for (const s of slots) {
          try {
            // Treat computed slots as Singapore-local times; normalize to UTC for comparisons
              // Build Singapore-local datetimes for the slot and convert to UTC for comparison
              const sgStartRaw = `${dateStr}T${s.start}`
              const sgEndRaw = `${dateStr}T${s.end}`
              const slotStartUtc = sgtLocalToUtcIso(sgStartRaw)
              const slotEndUtc = sgtLocalToUtcIso(sgEndRaw)
            if (!slotStartUtc || !slotEndUtc) continue
            // check if any fetched appointment overlaps this slot (compare in UTC)
            const overlap = (fetchedAppointments.value || []).some(a => {
              const aStartRaw = a.start_time ?? a.startTime ?? a.start
              const aEndRaw = a.end_time ?? a.endTime ?? a.end
              const aStartUtc = hasTz(aStartRaw) ? sgtLocalToUtcIso(aStartRaw) : sgtLocalToUtcIso(aStartRaw)
              const aEndUtc = hasTz(aEndRaw) ? sgtLocalToUtcIso(aEndRaw) : sgtLocalToUtcIso(aEndRaw)
              if (!aStartUtc || !aEndUtc) return false
              const aStartMs = new Date(aStartUtc).getTime()
              const aEndMs = new Date(aEndUtc).getTime()
              const sMs = new Date(slotStartUtc).getTime()
              const eMs = new Date(slotEndUtc).getTime()
              return aStartMs < eMs && aEndMs > sMs
            })
            if (!overlap) {
              dateHasFree = true
              break
            }
          } catch (e) {
            // ignore parse errors
          }
        }
        if (dateHasFree) break
      }

      if (dateHasFree) out.add(dateStr)
    }

    return out
  })

  // Array form for templates (easier to iterate / pass as prop)
  const availableDatesArray = computed(() => Array.from(availableDates.value || []))



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
      // derive date string from bookingData if available so slot timestamps include the selected date
      const dateStr = bookingData.value.date ? bookingData.value.date.toString() : null
      // map to a shape similar to TimeSlot expected by UI (slot_start, slot_end, id)
      // Ensure generated timestamps include Singapore offset so parsing and display
      // are consistent (avoid implicit conversion to UTC display in some browsers).
      return scheduleSlots.value.map((s, idx) => {
        const dayPrefix = dateStr ? `${dateStr}T` : ''
        const rawStart = `${dayPrefix}${s.start}${dateStr ? ':00' : ''}`
        const rawEnd = `${dayPrefix}${s.end}${dateStr ? ':00' : ''}`
        const slotStart = ensureSgtOffset(rawStart) || rawStart
        const slotEnd = ensureSgtOffset(rawEnd) || rawEnd
        return {
          id: `sch-${dateStr ?? 'nodate'}-${idx}-${s.start.replace(/[: ]/g, '')}`,
          slot_start: slotStart,
          slot_end: slotEnd,
          display: `${utcIsoToSgTime(slotStart) ?? s.start} - ${utcIsoToSgTime(slotEnd) ?? s.end}`,
          booked: (s as any).booked === true
        }
      })
    }

    if (!bookingData.value.doctor || !bookingData.value.date) return []
    return availableTimeSlots.value
      .filter((slot: TimeSlot) => slot.doctor_id === bookingData.value.doctor?.id)
      .map((slot: TimeSlot) => ({
        id: slot.id,
        slot_start: slot.slot_start,
        slot_end: slot.slot_end,
  display: `${new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })} - ${new Date(slot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}`,
  booked: slot.status === 'scheduled'
      }))
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
  // Derive date string in Singapore local date (YYYY-MM-DD) to build SGT-local slot timestamps
  const dateStr = bookingData.value.date ? bookingData.value.date.toString() : new Date(String(date)).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

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
          // Ensure we interpret the times as Singapore-local before converting to ISO
          const sgStartRaw = `${dateStr}T${s.start}`
          const sgEndRaw = `${dateStr}T${s.end}`
          const startWithOffset = ensureSgtOffset(sgStartRaw) || sgStartRaw
          const endWithOffset = ensureSgtOffset(sgEndRaw) || sgEndRaw
          const slotStartIso = new Date(startWithOffset).toISOString()
          const slotEndIso = new Date(endWithOffset).toISOString()
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
  // let Vue flush the DOM updates before doing additional reactive writes
  await import('vue').then(m => m.nextTick())

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
              .eq('status', 'scheduled')

            if (tsQ.error) {
              console.error('Error querying scheduled time_slots for doctor', doctorId, tsQ.error)
            } else {
              const bookedSlots = (tsQ.data ?? []) as any[]
              console.log(`Found ${bookedSlots.length} scheduled time_slots for doctor ${doctorId}:`, bookedSlots)
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

  // Fetch appointments for a given doctor and optionally compute slots for a date
  const fetchAppointmentsForDoctor = async (doctorId: number, date?: DateValue) => {
    try {
      let appts: any[] = []

      try {
        const env = (import.meta.env as any)
        const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
        const endpoint = `${apiBase.replace(/\/+$/, '')}/staff/appointments?doctorId=${doctorId}`
        const r = await fetch(endpoint, { headers: { Accept: 'application/json' } })
        if (r.ok) {
          const data = await r.json()
          appts = (data ?? []) as any[]
        }
      } catch (backendErr) {
        // fallback to Supabase if backend fails
        console.warn('fetchAppointmentsForDoctor: backend query failed, falling back to Supabase', backendErr)
      }

      if (!appts || appts.length === 0) {
        try {
          const apptQ = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)

          if (!apptQ.error) appts = (apptQ.data ?? []) as any[]
        } catch (serr) {
          console.warn('fetchAppointmentsForDoctor: Supabase query failed', serr)
        }
      }

      fetchedAppointments.value = appts ?? []

      // If a date was provided, compute slots for that date so booked flags are annotated
      if (date && doctorId != null) {
        try {
          await loadSlotsForDate(doctorId, date)
        } catch (e) {
          console.warn('fetchAppointmentsForDoctor: loadSlotsForDate failed', e)
        }
      }

      return fetchedAppointments.value
    } catch (err) {
      console.error('fetchAppointmentsForDoctor error', err)
      return [] as any[]
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
          // Helper: convert a time-of-day string that is in UTC (HH:mm[:ss]) to Singapore local time (HH:mm)
          const convertUtcTimeToSgt = (timeStr: string | null | undefined) => {
            if (!timeStr) return timeStr
            // Expect formats like '01:00:00' or '01:00'
            const parts = (timeStr || '').split(':').map((p: string) => parseInt(p, 10) || 0)
            let hh = parts[0] || 0
            const mm = parts[1] || 0
            // Add 8 hours to convert UTC -> SGT
            hh = (hh + 8) % 24
            const pad = (n: number) => n.toString().padStart(2, '0')
            return `${pad(hh)}:${pad(mm)}`
          }

          const scheduleWithSlots = rows.map(row => {
            // For API-sourced rows we treat returned times as UTC-of-day and convert to SGT
            const start = convertUtcTimeToSgt(row.start_time)
            const end = convertUtcTimeToSgt(row.end_time)
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
          // persist fetched schedules for calendar availability checks
          fetchedSchedules.value = scheduleWithSlots
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
        // persist fetched schedules for calendar availability checks
        fetchedSchedules.value = scheduleWithSlots
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
  console.log('Appointment scheduled successfully:', result.appointmentId)
        return true
      } else {
        console.error('Booking failed:', result.message)
        return false
      }
      */

      if (!bookingData.value.clinic || !bookingData.value.doctor || !bookingData.value.date) {
        throw new Error('Missing required booking information')
      }

      const { currentUser, getAccessToken } = useAuth()

      // Derive start/end from bookingData.timeSlot if available, otherwise from scheduleSlots selection
      // Ensure timestamps are timezone-aware for Singapore (Supabase uses Asia/Singapore timestamps)
      let startIso: string | null = null
      let endIso: string | null = null
      if (bookingData.value.timeSlot) {
        const ts = bookingData.value.timeSlot as any
        // support different shapes
        if (ts.slot_start && ts.slot_end) {
          // slot_start may already include timezone like '+08:00' — reuse if present
          startIso = ensureSgtOffset(ts.slot_start)
          endIso = ensureSgtOffset(ts.slot_end)
        } else if (ts.start && ts.end) {
          // times like '09:00' - combine with date and append Singapore offset
          const dateStr = bookingData.value.date.toString()
          startIso = ensureSgtOffset(`${dateStr}T${ts.start}:00`)
          endIso = ensureSgtOffset(`${dateStr}T${ts.end}:00`)
        } else if (ts.display) {
          const parts = (ts.display as string).split('-').map(s => s.trim())
          const dateStr = bookingData.value.date.toString()
          startIso = ensureSgtOffset(`${dateStr}T${parts[0]}:00`)
          endIso = ensureSgtOffset(`${dateStr}T${parts[1]}:00`)
        }
      } else if (scheduleSlots.value && scheduleSlots.value.length > 0) {
        // if scheduleSlots present, take the first one or selected index - we expect bookingData.timeSlot was set
        const first = scheduleSlots.value[0]
        const dateStr = bookingData.value.date.toString()
        startIso = ensureSgtOffset(`${dateStr}T${first.start}:00`)
        endIso = ensureSgtOffset(`${dateStr}T${first.end}:00`)
      }

      if (!startIso || !endIso) throw new Error('Unable to determine start/end time for booking')

  // Convert the selected Singapore-local datetimes for sending.
  // Prefer sending clinic-local timestamps with explicit +08:00 offset so backend
  // can log and validate them easily. Also include UTC ISO for backward compatibility.
  const startSgt = ensureSgtOffset(startIso)
  const endSgt = ensureSgtOffset(endIso)
  const startUtc = sgtLocalToUtcIso(startIso)
  const endUtc = sgtLocalToUtcIso(endIso)
  if (!startSgt || !endSgt || !startUtc || !endUtc) throw new Error('Failed to convert selected times to proper ISO formats')

      // Preflight validation: ensure the selected slot exists in availableSlots (compare in UTC)
      try {
        const sel = bookingData.value.timeSlot as any
        if (sel) {
          const dateStr = bookingData.value.date ? bookingData.value.date.toString() : null

          const normalizedAvailableStarts = (availableSlots.value || []).map((s: any) => {
            const raw = s?.slot_start || ''
            const utc = hasTz(raw) ? sgtLocalToUtcIso(raw) : sgtLocalToUtcIso(`${raw}${SGT_OFFSET}`)
            return { id: s?.id, slot_start: raw, normalizedUtc: utc }
          })

          // Compute selected start normalized to UTC for comparison
          let selStartUtc: string | null = null
          if (hasTz(sel?.slot_start || '')) {
            selStartUtc = sgtLocalToUtcIso(sel.slot_start)
          } else if (sel?.start && dateStr) {
            selStartUtc = sgtLocalToUtcIso(`${dateStr}T${sel.start}:00`)
          } else if (sel?.slot_start && dateStr) {
            const raw = sel.slot_start
            selStartUtc = hasTz(raw) ? sgtLocalToUtcIso(raw) : sgtLocalToUtcIso(`${raw}${SGT_OFFSET}`)
          }

          const foundById = sel?.id ? (availableSlots.value || []).some((s: any) => s && s.id === sel.id) : false
          const foundByStart = selStartUtc ? normalizedAvailableStarts.some((a: any) => a.normalizedUtc === selStartUtc) : false

          if (!foundById && !foundByStart) {
            console.warn('Preflight validation: selected slot not found in availableSlots', {
              dateStr,
              selectedRaw: sel,
              selectedNormalizedStartUtc: selStartUtc,
              sampleAvailable: normalizedAvailableStarts.slice(0, 8)
            })

            toast.error('Requested time is outside doctor schedule', {
              description: 'The selected time slot is not available for this doctor. Please choose another time.'
            })
            return { success: false, status: 422 }
          }
        }
      } catch (e) {
        // ignore validation failure and proceed; backend will also validate
        console.error('Preflight validation error', e)
      }

      // Resolve API base
      const env = (import.meta.env as any)
      const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
      const endpoint = `${apiBase.replace(/\/+$/, '')}/appointments`

      const payload = {
        clinicId: bookingData.value.clinic.id,
        doctorId: bookingData.value.doctor.id,
        patientId: undefined as number | undefined, // replaced below from auth
        // include both representations: clinic-local (SGT) and UTC (Z)
        startTime: startSgt,           // primary: '2025-10-27T09:30:00+08:00'
        endTime: endSgt,
        startTimeUtc: startUtc,       // compatibility: '2025-10-27T01:30:00.000Z'
        endTimeUtc: endUtc,
        treatmentSummary: null
      }

      // Resolve patient id from auth state if available
      try {
        // Prefer explicit patient relation id when available; otherwise fall back to profile.id (if that maps to patient id in your schema)
        const p = currentUser.value?.patient?.id ?? currentUser.value?.profile?.id ?? null
        if (p) payload.patientId = p
      } catch (e) {
        payload.patientId = undefined
      }

      // If still no patient id, attempt to get from access token / session as last resort
      if (!payload.patientId) {
        // Not logged in as patient — show friendly toast and abort
        toast.error('Unable to identify patient', {
          description: 'Please login as a patient before booking an appointment.',
        })
        return { success: false, status: 401 }
      }

      // Generate an idempotency key for this booking attempt and keep it per-composable instance
      // So repeated clicks during the same flow reuse the same key
      const idempotencyKeyRef = (bookingData as any)._idempotencyKey ||= ref<string | null>(null)
      if (!idempotencyKeyRef.value) {
        // Prefer crypto.randomUUID when available
        try {
          idempotencyKeyRef.value = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        } catch (_) {
          idempotencyKeyRef.value = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        }
      }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      // include idempotency key as header; backend should honor it
      if (idempotencyKeyRef.value) headers['Idempotency-Key'] = idempotencyKeyRef.value
      // if backend expects auth bearer token, attach it
      try {
        const token = await getAccessToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
      } catch (e) {
        // ignore
      }

      console.log('Posting appointment to backend:', endpoint, payload)
      // Some backends (Postgres controllers, server frameworks) expect snake_case column names.
      // Include both camelCase and snake_case keys to be compatible while the backend is confirmed.
      const requestBody = {
        ...payload,
        idempotencyKey: idempotencyKeyRef.value,
        // snake_case aliases
        clinic_id: payload.clinicId,
        doctor_id: payload.doctorId,
        patient_id: payload.patientId,
        start_time: payload.startTime,
        end_time: payload.endTime,
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      const status = res.status
      let bodyText = ''
      try { bodyText = await res.text() } catch {}

      // Try parse JSON if available
      let json: any = null
      try { json = bodyText ? JSON.parse(bodyText) : null } catch { json = null }

      if (status === 201 || (res.ok && (json || {}).id)) {
  toast.success('Your appointment has been successfully scheduled', {
  description: 'A confirmation has been created and will appear in your appointments list.',
  })
        console.log('Appointment created:', json)
        return { success: true, status, created: json }
      }

      if (status === 409) {
        // Conflict — appointment already exists for that doctor/start_time
  const conflictMsg = (json && (json.message || json.error)) ? (json.message || json.error) : 'The selected time slot is already scheduled.'
        toast.error('Time slot unavailable', {
          description: conflictMsg
        })
        // return the existing resource if backend includes it
        return { success: false, status, existing: json }
      }

      // other non-success responses
      const serverMsg = (json && (json.message || json.error)) ? (json.message || json.error) : bodyText || `HTTP ${status}`
      console.error('Backend returned error creating appointment', status, serverMsg)
      toast.error('Failed to book appointment', {
        description: String(serverMsg).slice(0, 200)
      })
      return { success: false, status }
    } catch (error) {
      console.error('Booking failed:', error)
      toast.error('Failed to book appointment', { description: (error as any)?.message ?? String(error) })
      return { success: false, status: 0 }
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
    availableWeekdays,
  availableDates,
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
    fetchAppointmentsForDoctor,
    confirmBooking
  }
}


