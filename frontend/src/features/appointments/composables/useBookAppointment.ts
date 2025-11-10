import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api'
import { patientSchedulesApi } from '@/services/patientSchedulesApi'
import { patientDoctorsApi } from '@/services/patientDoctorsApi'
import { patientClinicsApi } from '@/services/patientClinicsApi'
import { appointmentsApi } from '@/services/appointmentsApi'
import { useAuth } from '@/features/auth/composables/useAuth'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { ensureSgtOffset, SGT_OFFSET, hasTz, sgtLocalToUtcIso, utcIsoToSgTime } from '@/lib/utils'

// Type aliases from database
type Clinic = Tables<'clinics'>
type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Booking data interface
interface BookingData {
  clinic: Clinic | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
}

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

  // Clinics will be loaded from the backend. Start empty so no dummy data is shown.
  const allClinics = ref<Clinic[]>([])

  // Doctors will be populated from the backend when a clinic is selected. Start empty.
  const allDoctors = ref<Doctor[]>([])

  // Time slots will be populated from backend (appointments/time_slots). Start empty.
  const availableTimeSlots = ref<TimeSlot[]>([])

  // Computed slots for the selected doctor/date (array of { start, end, display, booked? })
  const scheduleSlots = ref<Array<{ start: string; end: string; display: string; booked?: boolean }>>([])
  // Appointments fetched for the currently-selected doctor (used to mark slots as booked)
  const fetchedAppointments = ref<any[]>([])
  // Appointments fetched for the current patient (used to mark slots that conflict with patient's other appts)
  const fetchedPatientAppointments = ref<any[]>([])
  // Raw schedules fetched (with computed_slots) so calendar can highlight weekdays with availability
  const fetchedSchedules = ref<any[]>([])
  // Preserve the raw schedule rows returned from API/Supabase (before validity filtering)
  const fetchedSchedulesRaw = ref<any[]>([])

  // Helper: convert a raw date/time value to SGT-local date string 'YYYY-MM-DD'
  const toSgtDate = (raw: any): string | null => {
    if (raw == null) return null
    try {
      const d = new Date(String(raw))
      if (isNaN(d.getTime())) return null
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    } catch (_) {
      return null
    }
  }

  const scheduleFetchPromises = new Map<number, Promise<any[]>>()
  const lastFetchedDoctorId = ref<number | null>(null)

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
    // current instant in ms (UTC) for comparisons
    const nowMs = Date.now()
    // current date in Singapore (YYYY-MM-DD)
    const todaySgt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
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
        // Respect per-row validity (valid_from / valid_to) when computing
        // availability for a specific date. fetchedSchedules may have been
        // filtered for a different reference date (e.g. today), so we must
        // re-check the row's valid range for the candidate date.
        try {
          const vFrom = toSgtDate((row as any).valid_from ?? (row as any).validFrom ?? null)
          const vTo = toSgtDate((row as any).valid_to ?? (row as any).validTo ?? null)
          if (vFrom && dateStr < vFrom) continue
          if (vTo && dateStr > vTo) continue
        } catch (e) {
          // if validity parsing fails, conservatively proceed to slot checks
        }
        // get slots for this row
        const slots = Array.isArray(row.computed_slots) && row.computed_slots.length > 0
          ? row.computed_slots.map((s: string) => {
              const parts = s.split('-').map((p: string) => p.trim())
              return { start: parts[0], end: parts[1], display: s }
            })
          : computeSlotsFromScheduleRow(row, dateStr)

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
            // Only appointments with these statuses should block a slot (grey it out)
            const blockingStatuses = ['checked_in', 'completed', 'scheduled', 'confirmed']
            const overlap = (fetchedAppointments.value || []).some(a => {
              const aStartRaw = a.start_time ?? a.startTime ?? a.start
              const aEndRaw = a.end_time ?? a.endTime ?? a.end
              const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''

              // If the appointment status is present but not in blocking list, ignore it
              if (status && !blockingStatuses.includes(status)) return false

              const aStartUtc = hasTz(aStartRaw) ? sgtLocalToUtcIso(aStartRaw) : sgtLocalToUtcIso(aStartRaw)
              const aEndUtc = hasTz(aEndRaw) ? sgtLocalToUtcIso(aEndRaw) : sgtLocalToUtcIso(aEndRaw)
              if (!aStartUtc || !aEndUtc) return false
              const aStartMs = new Date(aStartUtc).getTime()
              const aEndMs = new Date(aEndUtc).getTime()
              const sMs = new Date(slotStartUtc).getTime()
              const eMs = new Date(slotEndUtc).getTime()
              const isOverlap = aStartMs < eMs && aEndMs > sMs
              if (isOverlap) {
                // Slot overlap detected. Removed noisy console output in production flow.
              }
              return isOverlap
            })
            if (!overlap) {
              // If this is today (SGT), ensure the slot start is in the future
              if (dateStr === todaySgt) {
                try {
                  const slotStartMs = new Date(slotStartUtc).getTime()
                  if (slotStartMs <= nowMs) continue
                } catch (e) {
                  // if parsing fails, conservatively skip
                  continue
                }
              }
              dateHasFree = true
              break
            }
          } catch (e) {
          }
        }
        if (dateHasFree) break
      }

      if (dateHasFree) out.add(dateStr)
    }

    return out
  })

  const availableDatesArray = computed(() => Array.from(availableDates.value || []))



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

    if (scheduleSlots.value && scheduleSlots.value.length > 0) {
      // derive date string from bookingData if available so slot timestamps include the selected date
      const dateStr = bookingData.value.date ? bookingData.value.date.toString() : null
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
      .map((slot: TimeSlot) => {
        try {
          const startIso = ensureSgtOffset(String(slot.slot_start)) || String(slot.slot_start)
          const endIso = ensureSgtOffset(String(slot.slot_end)) || String(slot.slot_end)
          const slotStartIso = new Date(startIso).toISOString()
          const slotEndIso = new Date(endIso).toISOString()

          // Consider the slot booked if the time_slot row is marked scheduled OR
          // if the doctor has an overlapping appointment OR the current patient has an overlapping appointment
          const blockingStatuses = ['scheduled', 'checked_in', 'confirmed']
          const slotMarkedScheduled = String(slot.status ?? '').toString().toLowerCase() === 'scheduled'

          const doctorOverlap = (fetchedAppointments.value || []).some(a => {
            try {
              const aStartRaw = a.start_time ?? a.startTime ?? a.start
              const aEndRaw = a.end_time ?? a.endTime ?? a.end
              const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''
              if (status && !blockingStatuses.includes(status)) return false
              const aStart = new Date(aStartRaw).getTime()
              const aEnd = new Date(aEndRaw).getTime()
              const sMs = new Date(slotStartIso).getTime()
              const eMs = new Date(slotEndIso).getTime()
              return !isNaN(aStart) && !isNaN(aEnd) && aStart < eMs && aEnd > sMs
            } catch (e) { return false }
          })

          const patientOverlap = (fetchedPatientAppointments.value || []).some(a => {
            try {
              const aStartRaw = a.start_time ?? a.startTime ?? a.start
              const aEndRaw = a.end_time ?? a.endTime ?? a.end
              const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''
              if (status && !blockingStatuses.includes(status)) return false
              const aStart = new Date(aStartRaw).getTime()
              const aEnd = new Date(aEndRaw).getTime()
              const sMs = new Date(slotStartIso).getTime()
              const eMs = new Date(slotEndIso).getTime()
              return !isNaN(aStart) && !isNaN(aEnd) && aStart < eMs && aEnd > sMs
            } catch (e) { return false }
          })
          // If the patient has an overlapping appointment, log details for debugging
          if (patientOverlap) {
            try {
              const { currentUser } = useAuth()
              const patientId = currentUser.value?.patient?.id ?? currentUser.value?.profile?.id ?? null
              const selectedDate = bookingData.value.date ? String(bookingData.value.date) : null
              const conflicting = (fetchedPatientAppointments.value || []).filter(a => {
                try {
                  const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''
                  if (status && !blockingStatuses.includes(status)) return false
                  const aStart = new Date(a.start_time ?? a.startTime ?? a.start).toISOString()
                  const aEnd = new Date(a.end_time ?? a.endTime ?? a.end).toISOString()
                  const s = new Date(slotStartIso).toISOString()
                  const e = new Date(slotEndIso).toISOString()
                  const aStartMs = new Date(aStart).getTime()
                  const aEndMs = new Date(aEnd).getTime()
                  const sMs = new Date(s).getTime()
                  const eMs = new Date(e).getTime()
                  return !isNaN(aStartMs) && !isNaN(aEndMs) && aStartMs < eMs && aEndMs > sMs
                } catch (err) { return false }
              }).map(a => ({
                id: a.id,
                doctor: a.doctor_name ?? a.doctorName ?? a.doctor_id ?? null,
                clinic: a.clinic_name ?? a.clinicName ?? a.clinic_id ?? null,
                status: a.status ?? a.appointment_status ?? null,
                start: a.start_time ?? a.startTime ?? a.start,
                end: a.end_time ?? a.endTime ?? a.end
              }))

              console.log('[BOOKING][PATIENT-CONFLICT] slot blocked for patient due to existing appointment', {
                patientId,
                selectedDate,
                slotStart: slotStartIso,
                slotEnd: slotEndIso,
                bookingDoctor: bookingData.value.doctor ? { id: bookingData.value.doctor.id, name: bookingData.value.doctor.name } : null,
                bookingClinic: bookingData.value.clinic ? { id: bookingData.value.clinic.id, name: bookingData.value.clinic.name } : null,
                conflictingAppointments: conflicting
              })
            } catch (logErr) {
              console.warn('Failed to log patient conflict details', logErr)
            }
          }

          const booked = slotMarkedScheduled || doctorOverlap || patientOverlap

          return {
            id: slot.id,
            slot_start: slot.slot_start,
            slot_end: slot.slot_end,
            display: `${new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })} - ${new Date(slot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}`,
            booked
          }
        } catch (e) {
          return {
            id: slot.id,
            slot_start: slot.slot_start,
            slot_end: slot.slot_end,
            display: `${new Date(slot.slot_start).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })} - ${new Date(slot.slot_end).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}`,
            booked: String(slot.status ?? '').toLowerCase() === 'scheduled'
          }
        }
      })
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
  const router = useRouter()
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

  const selectDoctor = async (doctor: Doctor) => {
    bookingData.value.doctor = doctor

    // After selecting a doctor, fetch their schedules and appointments,
    // then compute and load available slots for a selected or the next
    // available date so the UI can immediately show timings.
    if (doctor?.id != null) {
      try {
        const doctorId = doctor.id

        await fetchSchedulesFromSupabase(doctorId)

        await fetchAppointmentsForDoctor(doctorId)

        // If user hasn't selected a date yet, pick the earliest available date
        // that actually has at least one bookable (non-past / non-booked) slot.
        if (!bookingData.value.date) {
          const candidates = availableDatesArray.value || []
          for (const dateStr of candidates) {
            try {
              const parsed = parseDate(String(dateStr)) as any
              // loadSlotsForDate will populate scheduleSlots.value and apply
              // the "today only future slots" filter we implemented above.
              await loadSlotsForDate(doctorId, parsed)
              if (scheduleSlots.value && scheduleSlots.value.length > 0) {
                bookingData.value.date = parsed
                break
              }
            } catch (e) {
              // move to next candidate
              continue
            }
          }
        }

        // If a date is available/selected, compute per-date slots and annotate booked flags
        if (bookingData.value.date) {
          await loadSlotsForDate(doctorId, bookingData.value.date)
        }
      } catch (err) {
        console.warn('selectDoctor flow failed:', err)
      }
    }
  }

  const selectDate = (date: DateValue) => {
    bookingData.value.date = date
    bookingData.value.timeSlot = null
    // When user selects a date, compute available slots for the selected doctor (if any)
    if (bookingData.value.doctor && bookingData.value.doctor.id != null) {
      loadSlotsForDate(bookingData.value.doctor.id, date).catch(err => console.warn('loadSlotsForDate failed:', err))
    }
    
  }

  const selectTimeSlot = (timeSlot: TimeSlot) => {
    bookingData.value.timeSlot = (timeSlot as any) || null

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

  // Helper: compute per-interval slots for a schedule row.
  // The DB stores schedule times as LocalTime that are interpreted by the backend
  // as UTC-of-day and converted to clinic local time (SGT). To keep frontend
  // and backend consistent (without changing DB), convert stored UTC-of-day
  // to SGT and generate slots in SGT local times.
  const computeSlotsFromScheduleRow = (row: any, targetDateStr?: string) => {
    const storedStart = (row as any).start_time ?? (row as any).startTime
    const storedEnd = (row as any).end_time ?? (row as any).endTime
    const duration = Number(row.slot_duration_minutes ?? row.slotDurationMinutes) || 0

    // Determine reference date in SGT for conversions
    const refDate = targetDateStr || (bookingData.value.date ? String(bookingData.value.date) : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }))

    const slots: Array<{ start: string; end: string; display: string }> = []
    if (storedStart && storedEnd && duration > 0) {
      const parseToMinutes = (t: string) => {
        const parts = t.split(':').map((p: string) => parseInt(p, 10))
        const hh = parts[0] || 0
        const mm = parts[1] || 0
        return hh * 60 + mm
      }

      // Stored schedule times are already clinic-local (SGT). Trim to HH:MM.
      const toSgtHHMM = (storedTime: string) => {
        return storedTime.split(':').slice(0,2).join(':')
      }

      const sStart = toSgtHHMM(storedStart)
      const sEnd = toSgtHHMM(storedEnd)

      const startMin = parseToMinutes(sStart)
      let endMin = parseToMinutes(sEnd)

      // If end is not after start in local SGT, assume it crosses midnight and add 24h
      if (endMin <= startMin) endMin += 24 * 60

      const toHHMM = (mins: number) => {
        const m = mins % (24 * 60)
        const h = Math.floor(m / 60).toString().padStart(2, '0')
        const mm = (m % 60).toString().padStart(2, '0')
        return `${h}:${mm}`
      }

      for (let m = startMin; m + duration <= endMin; m += duration) {
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

      const rows = await fetchSchedulesFromSupabase(doctorId)

      // Build SGT-local target date string 'YYYY-MM-DD' for validity checks
      const targetDateStr = bookingData.value.date
        ? String(bookingData.value.date)
        : new Date(String(date)).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

      // Only include schedule rows that match the weekday AND whose valid_from/valid_to
      // (normalized to SGT date) include the target date (inclusive).
      const matching = (rows ?? []).filter((r: any) => {
        try {
          if (Number(r.day_of_week) !== Number(dayNum)) return false

          const vFrom = toSgtDate((r as any).valid_from ?? (r as any).validFrom ?? null)
          const vTo = toSgtDate((r as any).valid_to ?? (r as any).validTo ?? null)

          // If vFrom exists and targetDateStr is before it, exclude
          if (vFrom && targetDateStr < vFrom) return false
          // If vTo exists and targetDateStr is after it, exclude
          if (vTo && targetDateStr > vTo) return false

          return true
        } catch (e) {
          return false
        }
      })

      // Combine all valid schedule rows for the target date, compute per-row slots,
      // filter out slots whose start falls outside the row's valid_from/valid_to bounds,
      // then merge/dedupe and sort.
      const mergedSlots: Array<{ start: string; end: string; display: string }> = []
      for (const row of matching) {
        // per-row validity bounds (raw values may be null)
        const vFromRaw = (row as any).valid_from ?? (row as any).validFrom ?? null
        const vToRaw = (row as any).valid_to ?? (row as any).validTo ?? null

        // Use date-only (SGT) comparisons for per-row validity to match the
        // calendar availability logic. Convert raw validity values to SGT
        // 'YYYY-MM-DD' strings when possible and compare targetDateStr
        // inclusively: targetDateStr >= vFrom && targetDateStr <= vTo.
        const vFrom = vFromRaw ? toSgtDate(vFromRaw) : null
        const vTo = vToRaw ? toSgtDate(vToRaw) : null

        const perRowSlots = Array.isArray(row.computed_slots) && row.computed_slots.length > 0
          ? row.computed_slots.map((s: string) => {
              const parts = s.split('-').map((p: string) => p.trim())
              return { start: parts[0], end: parts[1], display: s }
            })
          : computeSlotsFromScheduleRow(row)

        for (const s of perRowSlots) {
          try {
            // If the row has date-only validity bounds, enforce them using
            // the SGT date string for the target date. This mirrors the
            // earlier matching filter and ensures inclusive date comparison.
            if (vFrom && targetDateStr < vFrom) continue
            if (vTo && targetDateStr > vTo) continue

            // If no date-only bounds exist, fall back to slot-level checks
            // using the slot start instant (previous behavior). This handles
            // cases where valid_from/valid_to are full timestamps and cannot
            // be converted to SGT date strings.
            if (!vFrom && !vTo) {
              const sgStartRaw = `${targetDateStr}T${s.start}`
              const startWithOffset = ensureSgtOffset(sgStartRaw) || sgStartRaw
              const slotStartIso = new Date(startWithOffset).toISOString()
              const slotStartMs = new Date(slotStartIso).getTime()
              // try parse raw timestamps and compare (best-effort)
              const vFromMsFallback = vFromRaw ? new Date(String(vFromRaw)).getTime() : null
              const vToMsFallback = vToRaw ? new Date(String(vToRaw)).getTime() : null
              if (vFromMsFallback && slotStartMs < vFromMsFallback) continue
              if (vToMsFallback && slotStartMs > vToMsFallback) continue
            }

            mergedSlots.push(s)
          } catch (e) {
            // skip problematic slots conservatively
          }
        }
      }

      const unique = Array.from(new Map(mergedSlots.map(s => [s.display, s])).values())
      unique.sort((a, b) => a.start.localeCompare(b.start))

      const dateStr = targetDateStr

      const overlaps = (slotStartIso: string, slotEndIso: string, appts: any[]) => {
        if (!appts || appts.length === 0) return false
        try {
          const s = new Date(slotStartIso).getTime()
          const e = new Date(slotEndIso).getTime()
          for (const a of appts) {
            const aStartRaw = a.start_time ?? a.startTime ?? a.start
            const aEndRaw = a.end_time ?? a.endTime ?? a.end
            const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''

            // Only consider appointments with blocking statuses
            const blockingStatuses = ['checked_in', 'completed', 'scheduled', 'confirmed']
            if (status && !blockingStatuses.includes(status)) continue

            const aStart = new Date(aStartRaw).getTime()
            const aEnd = new Date(aEndRaw).getTime()
            if (isNaN(aStart) || isNaN(aEnd)) continue
            if (aStart < e && aEnd > s) {
              return true
            }
          }
        } catch (e) {
        }
        return false
      }

      const annotated = unique.map(s => {
        try {
          const sgStartRaw = `${dateStr}T${s.start}`
          const sgEndRaw = `${dateStr}T${s.end}`
          const startWithOffset = ensureSgtOffset(sgStartRaw) || sgStartRaw
          const endWithOffset = ensureSgtOffset(sgEndRaw) || sgEndRaw
          const slotStartIso = new Date(startWithOffset).toISOString()
          const slotEndIso = new Date(endWithOffset).toISOString()
          // Booked if doctor has overlapping appointment OR the current patient has an overlapping appointment
          const doctorOverlap = overlaps(slotStartIso, slotEndIso, fetchedAppointments.value)
          // For patient conflicts only consider statuses: scheduled, checked_in, confirmed
          const patientBlocking = ['scheduled', 'checked_in', 'confirmed']
          const patientOverlap = (fetchedPatientAppointments.value || []).some(a => {
            try {
              const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''
              if (status && !patientBlocking.includes(status)) return false
              const aStartRaw = a.start_time ?? a.startTime ?? a.start
              const aEndRaw = a.end_time ?? a.endTime ?? a.end
              const aStartMs = new Date(aStartRaw).getTime()
              const aEndMs = new Date(aEndRaw).getTime()
              const sMs = new Date(slotStartIso).getTime()
              const eMs = new Date(slotEndIso).getTime()
              return !isNaN(aStartMs) && !isNaN(aEndMs) && aStartMs < eMs && aEndMs > sMs
            } catch (e) { return false }
          })
          if (patientOverlap) {
            try {
              const { currentUser } = useAuth()
              const patientId = currentUser.value?.patient?.id ?? currentUser.value?.profile?.id ?? null
              const conflicting = (fetchedPatientAppointments.value || []).filter(a => {
                try {
                  const status = (a.status ?? a.appointment_status ?? '')?.toString?.() || ''
                  if (status && !patientBlocking.includes(status)) return false
                  const aStartMs = new Date(a.start_time ?? a.startTime ?? a.start).getTime()
                  const aEndMs = new Date(a.end_time ?? a.endTime ?? a.end).getTime()
                  const sMs = new Date(slotStartIso).getTime()
                  const eMs = new Date(slotEndIso).getTime()
                  return !isNaN(aStartMs) && !isNaN(aEndMs) && aStartMs < eMs && aEndMs > sMs
                } catch (err) { return false }
              }).map(a => ({
                id: a.id,
                doctor: a.doctor_name ?? a.doctorName ?? a.doctor_id ?? null,
                clinic: a.clinic_name ?? a.clinicName ?? a.clinic_id ?? null,
                status: a.status ?? a.appointment_status ?? null,
                start: a.start_time ?? a.startTime ?? a.start,
                end: a.end_time ?? a.endTime ?? a.end
              }))

              console.log('[BOOKING][PATIENT-CONFLICT] schedule slot blocked for patient', {
                patientId,
                selectedDate: bookingData.value.date ? String(bookingData.value.date) : null,
                slotStart: slotStartIso,
                slotEnd: slotEndIso,
                bookingDoctor: bookingData.value.doctor ? { id: bookingData.value.doctor.id, name: bookingData.value.doctor.name } : null,
                bookingClinic: bookingData.value.clinic ? { id: bookingData.value.clinic.id, name: bookingData.value.clinic.name } : null,
                conflictingAppointments: conflicting
              })
            } catch (logErr) {
              console.warn('Failed to log patient schedule conflict', logErr)
            }
          }
          const booked = doctorOverlap || patientOverlap
          return { ...s, booked }
        } catch (e) {
          return { ...s, booked: false }
        }
      })

      // If the loaded date is today in SGT, filter out slots that already started or are ongoing
      try {
        const todaySgt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
        const targetDateStr = dateStr
        if (targetDateStr === todaySgt) {
          const nowMs = Date.now()
          const future = annotated.filter(a => {
            try {
              const sgStartRaw = `${dateStr}T${a.start}`
              const slotStartUtc = sgtLocalToUtcIso(sgStartRaw)
              if (!slotStartUtc) return false
              return new Date(slotStartUtc).getTime() > nowMs
            } catch (e) { return false }
          })
          scheduleSlots.value = future
        } else {
          scheduleSlots.value = annotated
        }
      } catch (e) {
        scheduleSlots.value = annotated
      }

      try {
        const computedSlotsCount = annotated.length
        const bookedArr = annotated.filter(s => s.booked).map(s => `${s.start}-${s.end}`)
        const remainingArr = annotated.filter(s => !s.booked).map(s => `${s.start}-${s.end}`)

  const activeRowsCount = Array.isArray(matching) ? matching.length : 0
  const mergedSlotsCount = computedSlotsCount

  console.log(`[BOOKING][SLOTS] doctorId=${doctorId} date=${dateStr} (SGT)`)
  console.log(` ├─ activeRows=${activeRowsCount}`)
  console.log(` ├─ mergedSlots=${mergedSlotsCount}`)
  console.log(` ├─ bookedSlots=${bookedArr.length} → ${bookedArr.join(', ')}`)
  console.log(` └─ remainingAvailable=${remainingArr.length} → ${remainingArr.join(', ')}`)
      } catch (e) {
        console.log(`Computed ${scheduleSlots.value.length} available slots for doctor ${doctorId}`)
      }

      return scheduleSlots.value
    } catch (err) {
      console.error('loadSlotsForDate error', err)
      scheduleSlots.value = []
      return []
    }
  }

  const nextStep = async () => {
    if (canProceedToNextStep.value && !isLastStep.value) {
      try {
        const wasOnStep = currentStep.value
  currentStep.value++
  await import('vue').then(m => m.nextTick())

        if (wasOnStep === 2 && bookingData.value.doctor && bookingData.value.doctor.id != null) {
          const doctorId = bookingData.value.doctor.id
          console.log('>Next pressed after doctor selection - fetching schedules and appointments for doctorId=', doctorId)

          // Fetch schedules (uses existing helper which already logs details)
          try {
            await fetchSchedulesFromSupabase(doctorId)
          } catch (schErr) {
            console.warn('Failed to fetch schedules for doctor', doctorId, schErr)
          }

          // Fetch appointments for this doctor: backend-first, then Supabase fallback
          try {
            let appts: any[] = []

            try {
              console.log('Backend-first: querying appointments for doctor', doctorId)
              appts = await appointmentsApi.getDoctorAppointmentsForPatient(doctorId)
              console.log(`Patient API returned ${appts.length} appointments for doctor ${doctorId}:`, appts)
            } catch (backendErr) {
              console.warn('Backend appointments query failed, will fall back to Supabase:', backendErr)
              
              // If backend gave nothing, fallback to Supabase client-side query
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

            fetchedAppointments.value = appts ?? []
            // Also fetch current patient's appointments so we can detect patient-level conflicts
            try {
              await fetchPatientAppointments()
            } catch (fpErr) {
              console.warn('fetchPatientAppointments failed after fetching doctor appointments', fpErr)
            }
          } catch (aerr) {
            console.error('Failed to query appointments for doctor', doctorId, aerr)
          }


          try {
            const raw = (fetchedSchedulesRaw.value && fetchedSchedulesRaw.value.length > 0) ? fetchedSchedulesRaw.value : (fetchedSchedules.value || [])
            const total = raw.length
            const targetDateStr = bookingData.value.date
              ? String(bookingData.value.date)
              : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

            let activeCount = 0
            let skippedCount = 0
            console.log(`[BOOKING][VALIDITY] doctorId=${doctorId} total=${total} active=<calculating> skipped=<calculating>`)

            for (const row of raw) {
              const id = (row as any).id
              const day = (row as any).day_name ?? (row as any).day_of_week ?? (row as any).dayOfWeek ?? '?'
              const start = (row as any).start_time ?? (row as any).startTime ?? '?'
              const end = (row as any).end_time ?? (row as any).endTime ?? '?'
              const vFrom = toSgtDate((row as any).valid_from ?? (row as any).validFrom ?? null)
              const vTo = toSgtDate((row as any).valid_to ?? (row as any).validTo ?? null)

              let isActive = true
              if (vFrom && targetDateStr < vFrom) isActive = false
              if (vTo && targetDateStr > vTo) isActive = false

              if (isActive) {
                activeCount++
                console.log(` ├─ ${id} ${day} ${start}-${end} ✅ active (${vFrom ?? '-'}→${vTo ?? '-'})`)
              } else {
                skippedCount++
                console.log(` ├─ ${id} ${day} ${start}-${end} ❌ inactive (${vFrom ?? '-'}→${vTo ?? '-'})`)
              }
            }
            console.log(` └─ Total active rows: ${activeCount}`)
          } catch (e) {
          }

          // If a date is already selected, compute schedule slots for that date and log them
          if (bookingData.value.date) {
            try {
              await loadSlotsForDate(doctorId, bookingData.value.date)
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

  const fetchAppointmentsForDoctor = async (doctorId: number, date?: DateValue) => {
    try {
      let appts: any[] = []

      try {
        appts = await appointmentsApi.getDoctorAppointmentsForPatient(doctorId)
      } catch (backendErr) {
        console.warn('fetchAppointmentsForDoctor: backend query failed, falling back to Supabase', backendErr)
        
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
      // Ensure we also have the patient's appointments loaded so per-slot patient conflicts are detected
      try {
        await fetchPatientAppointments()
      } catch (e) {
        console.warn('fetchPatientAppointments failed in fetchAppointmentsForDoctor', e)
      }

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

  // Fetch current patient's appointments (backend-first, fallback to Supabase)
  const fetchPatientAppointments = async () => {
    try {
      let appts: any[] = []
      try {
        appts = await appointmentsApi.getPatientAppointments()
      } catch (backendErr) {
        console.warn('fetchPatientAppointments: backend query failed, falling back to Supabase', backendErr)
        try {
          // Try to resolve patient id from auth
          const { currentUser } = useAuth()
          let pId: number | null = null
          if (currentUser.value?.patient?.id) {
            pId = currentUser.value.patient.id
          } else if (currentUser.value?.id) {
            // lookup patients row by auth user id
            try {
              const { data: pRow } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', currentUser.value.id)
                .maybeSingle()
              if (pRow && (pRow as any).id) pId = (pRow as any).id
            } catch (e) {
              // ignore
            }
          }

          if (pId) {
            const apptQ = await supabase
              .from('appointments')
              .select('*')
              .eq('patient_id', pId)
            if (!apptQ.error) appts = (apptQ.data ?? []) as any[]
          }
        } catch (serr) {
          console.warn('fetchPatientAppointments: Supabase query failed', serr)
        }
      }

      fetchedPatientAppointments.value = appts ?? []
      return fetchedPatientAppointments.value
    } catch (err) {
      console.error('fetchPatientAppointments error', err)
      fetchedPatientAppointments.value = []
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

  const fetchDoctorsFromBackend = async (clinicId: number) => {
    try {
      console.log('fetchDoctorsFromBackend: requesting doctors for clinic', clinicId)
      const doctorsFromApi = await patientDoctorsApi.getDoctorsByClinicId(clinicId)
      console.log(`fetchDoctorsFromBackend: got ${doctorsFromApi.length} doctors for clinic ${clinicId} from patient API`, doctorsFromApi)

      if (doctorsFromApi.length === 0) return [] as Doctor[]

      const mappedDoctors = doctorsFromApi.map(raw => ({
        id: raw.id,
        clinic_id: raw.clinicId ?? clinicId,
        name: raw.name,
        specialty: raw.specialty ?? null,
        active: raw.active ?? true,
        created_at: raw.createdAt ?? null,
        updated_at: raw.updatedAt ?? null,
        source_ref: null
      })) as Doctor[]

      allDoctors.value = allDoctors.value.filter(d => d.clinic_id !== clinicId).concat(mappedDoctors)
      return mappedDoctors
    } catch (err) {
      console.error('fetchDoctorsFromBackend error for clinic', clinicId, err)
      return [] as Doctor[]
    }
  }

  const fetchSchedulesFromSupabase = async (doctorId: number) => {
    if (lastFetchedDoctorId.value === doctorId && fetchedSchedules.value && fetchedSchedules.value.length > 0) {
      return fetchedSchedules.value
    }

    if (scheduleFetchPromises.has(doctorId)) {
      return scheduleFetchPromises.get(doctorId)!
    }

    const p = (async () => {
      try {
        console.log('fetchSchedulesFromSupabase: attempting to load schedules via patient API for doctorId=', doctorId)

        function weekday(n: number) {
          const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          return names[(n - 1 + 7) % 7]
        }

        try {
          const apiData = await patientSchedulesApi.getSchedulesByDoctorId(doctorId)
          console.log(`patientSchedulesApi returned ${apiData?.length ?? 0} rows for doctor ${doctorId}:`, apiData)

          if (apiData && apiData.length > 0) {
           
            const rows = apiData as any[]

            // helper: convert various timestamp formats to Postgres-style
            // 'YYYY-MM-DD HH:MM:SS+00' (UTC). If input already matches, leave as-is.
            const toPgTzString = (raw: any): string | null => {
              if (raw == null) return null
              const s = String(raw)
              // Already in postgres-like format e.g. '2025-10-31 00:00:00+00'
              if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[+-]\d{2})?$/.test(s)) return s
              // Try parse as Date and format as UTC
              const d = new Date(s)
              if (isNaN(d.getTime())) return s
              const YYYY = d.getUTCFullYear()
              const MM = String(d.getUTCMonth() + 1).padStart(2, '0')
              const DD = String(d.getUTCDate()).padStart(2, '0')
              const hh = String(d.getUTCHours()).padStart(2, '0')
              const mm = String(d.getUTCMinutes()).padStart(2, '0')
              const ss = String(d.getUTCSeconds()).padStart(2, '0')
              return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}+00`
            }

            // compute slots without mutating original objects
            const scheduleWithSlots = rows.map(row => {
              const start = (row as any).start_time ?? (row as any).startTime
              const end = (row as any).end_time ?? (row as any).endTime
              const duration = Number((row as any).slot_duration_minutes ?? (row as any).slotDurationMinutes) || 0
              const dayNum = Number((row as any).day_of_week ?? (row as any).dayOfWeek) || 0

              // Generate SGT-local slots using shared helper which converts stored
              // UTC-of-day schedule times into SGT and returns per-interval slots.
              const slotObjs = computeSlotsFromScheduleRow(row)
              const slots: string[] = slotObjs.map(s => `${s.start} - ${s.end}`)

              return {
                // preserve original API fields exactly
                ...row,
                // also provide a DB-like UTC timezone string for valid_from/valid_to
                db_valid_from: toPgTzString((row as any).valid_from ?? (row as any).validFrom ?? (row as any).validFrom),
                db_valid_to: toPgTzString((row as any).valid_to ?? (row as any).validTo ?? (row as any).validTo),
                day_name: dayNum ? weekday(dayNum) : null,
                computed_slots: slots
              }
            })

            // Determine target date in SGT for validity checks: use selected booking date if available,
            // otherwise use today's date in Singapore time.
            const targetDateStr = bookingData.value.date
              ? String(bookingData.value.date)
              : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

            // Helper: convert various valid_from/valid_to raw values to SGT date string 'YYYY-MM-DD'
            const toSgtDate = (raw: any): string | null => {
              if (raw == null) return null
              try {
                // Parse raw into a Date and convert to SGT-local date string
                const d = new Date(String(raw))
                if (isNaN(d.getTime())) return null
                return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
              } catch (_) {
                return null
              }
            }

            // preserve raw rows for later structured logging in nextStep
            fetchedSchedulesRaw.value = scheduleWithSlots

            // Build activeRows by filtering schedules whose validity range includes targetDateStr
            const activeRows: any[] = []
            for (const row of scheduleWithSlots) {
              const vFrom = toSgtDate((row as any).valid_from ?? (row as any).validFrom ?? null)
              const vTo = toSgtDate((row as any).valid_to ?? (row as any).validTo ?? null)
              let isActive = true
              if (vFrom && targetDateStr < vFrom) isActive = false
              if (vTo && targetDateStr > vTo) isActive = false
              if (isActive) activeRows.push(row)
            }

            // persist active schedules for calendar availability checks
            fetchedSchedules.value = activeRows
            lastFetchedDoctorId.value = doctorId
            return activeRows
          }
        } catch (apiErr) {
          console.warn('patientSchedulesApi.getSchedulesByDoctorId failed, returning empty schedules:', apiErr)
        }
        return [] as any[]
      } catch (err: any) {
        console.error('Error fetching schedules from Supabase for doctor', doctorId, err)
        return [] as any[]
      } finally {
        // remove promise holder once done
        scheduleFetchPromises.delete(doctorId)
      }
    })()

    scheduleFetchPromises.set(doctorId, p)
    return p
  }

  const loadClinics = async () => {
    try {
      console.log('loadClinics: requesting clinics from patient API')
      const data = await patientClinicsApi.getAllClinics()
      console.log('Loaded clinics for patient booking:', data)

      const safeDate = (val: any) => {
        if (!val) return null
        const parsed = Date.parse(String(val))
        return Number.isNaN(parsed) ? null : new Date(parsed).toISOString()
      }

      allClinics.value = data.map(c => {
        const raw = c as any

        const pick = (...keys: string[]) => {
          for (const key of keys) {
            if (raw[key] !== undefined && raw[key] !== null) {
              return raw[key]
            }
          }
          return null
        }

        const clinicType = pick('clinicType', 'clinic_type') ?? 'General'
        const openTime = pick('openTime', 'open_time')
        const closeTime = pick('closeTime', 'close_time')

        return ({
          id: raw.id,
          name: raw.name,
          clinic_type: clinicType,
          region: pick('region'),
          area: pick('area'),
          address_line: pick('addressLine', 'address_line') ?? '',
          source_ref: pick('sourceRef', 'source_ref'),
          remarks: pick('remarks'),
          created_at: safeDate(pick('createdAt', 'created_at')),
          updated_at: safeDate(pick('updatedAt', 'updated_at')),
          open_time: openTime,
          close_time: closeTime,
          note: pick('note')
        } as Clinic)
      })
    } catch (error) {
      console.error('Failed to load clinics from patient API. Error:', error)
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

      // Resolve patient id from auth state if available
      let patientId: number | undefined = undefined
      try {
        // Prefer explicit patient relation id when available; otherwise fall back to profile.id (if that maps to patient id in your schema)
        const p = currentUser.value?.patient?.id ?? currentUser.value?.profile?.id ?? null
        if (p) patientId = p
      } catch (e) {
        patientId = undefined
      }

      // If still no patient id, attempt to get from access token / session as last resort
      if (!patientId) {
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

      const payload = {
        patient_id: patientId,
        doctor_id: bookingData.value.doctor.id,
        clinic_id: bookingData.value.clinic.id,
        // Use SGT timestamps as primary format
        start_time: startSgt,
        end_time: endSgt,
        treatment_summary: null
      }

      console.log('Posting appointment to backend:', payload)
      
      let json: any = null
      let status = 0
      
      try {
        json = await appointmentsApi.createPatientAppointment(payload, idempotencyKeyRef.value)
        status = 201 // Success
      } catch (error: any) {
        // Normalize an error message string for later parsing
        const errorMsg = (error && (error.message || String(error))) || String(error)

        // Prefer explicit status property from the thrown error (set by API client)
        if (error && typeof error.status === 'number') {
          status = error.status
        } else {
          // Try to determine status from error message
          if (errorMsg.includes('409') || errorMsg.toLowerCase().includes('conflict')) {
            status = 409
          } else if (errorMsg.includes('422')) {
            status = 422
          } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
            status = errorMsg.includes('401') ? 401 : 403
          } else {
            status = 500
          }
        }

        // Try to parse JSON from error message
        try {
          const jsonMatch = errorMsg.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          json = { message: errorMsg }
        }
      }

      if (status === 201 || (json && json.id)) {
        // Show success toast with default styling
        toast.success('Appointment Booked Successfully', {
          description: 'Your appointment has been scheduled. Redirecting to your appointments...',
          action: {
            label: 'View Now',
            onClick: () => {
              try {
                const highlightId = json?.id ?? (json && json.appointment && json.appointment.id) ?? null
                if (highlightId) router.push({ name: 'PatientAppointments', query: { highlight: String(highlightId) } })
                else router.push({ name: 'PatientAppointments' })
              } catch (navErr) {
                try { router.push('/patient/appointments') } catch (_) {}
              }
            }
          }
        })

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          try {
            const highlightId = json?.id ?? (json && json.appointment && json.appointment.id) ?? null
            if (highlightId) router.push({ name: 'PatientAppointments', query: { highlight: String(highlightId) } })
            else router.push({ name: 'PatientAppointments' })
          } catch (navErr) {
            try { router.push('/patient/appointments') } catch (_) {}
          }
        }, 2000)

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
      const serverMsg = (json && (json.message || json.error)) ? (json.message || json.error) : `HTTP ${status}`
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


