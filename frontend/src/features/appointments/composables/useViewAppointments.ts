import { ref, computed, watch, onMounted } from 'vue'
import type { DateValue } from '@internationalized/date'
import { CalendarDate, parseDate, getLocalTimeZone } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'

// Type aliases from database
// Add 'confirmed' so backend/client-confirmed appointments are recognized
// and include 'missed' as a synonym for 'no-show' used in some places
type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'

// TimeSlot interface for UI
interface TimeSlot {
  id: string
  time: string
  available: boolean
}

// Appointment interface for viewing (basic structure)
interface Appointment {
  id: string
  clinicName: string
  doctorName: string
  date: Date
  time: string
  status: AppointmentStatus
  specialization: string
  doctorSpecialty?: string
  clinicType?: string
  address: string
  notes?: string
}

// Extended appointment interface for view appointments
export interface ViewAppointment {
  id: number
  clinicName: string
  doctorName: string
  date: Date
  time: string
  status: AppointmentStatus
  specialization: string
  doctorSpecialty?: string
  clinicType?: string
  address: string
  notes?: string
  // Database fields
  patient_id: number
  doctor_id: number | null
  clinic_id: number | null
  time_slot_id: number | null
  treatment_summary: string | null
  created_at: string
  updated_at: string
}

export const useViewAppointments = () => {
  // Dummy appointment data
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)

  // Auth
  const { currentUser, getAccessToken } = useAuth()

  // Helper: map DB row to ViewAppointment/UI Appointment
  const mapRowToView = (row: any) => {
  // row fields: id, patient_id, doctor_id, clinic_id, status, created_at, updated_at, time_slot_id, treatment_summary
  // Prefer explicit appointment start time when available for accurate sorting/display.
  const preferredTime = row.start_time ?? row.slot_start ?? row.end_time ?? row.created_at
  const date = preferredTime ? new Date(preferredTime) : new Date()
    // best-effort mapping; some fields may be null
  const clinicName = (row as any).clinic_name || row.clinics?.name || 'Clinic'
  const clinicType = (row as any).clinic_type || row.clinics?.clinic_type || row.clinics?.clinicType || ''
  const doctorName = (row as any).doctor_name || row.doctors?.name || 'Doctor'
  const specialization = (row as any).specialty || row.doctors?.specialty || ''
  const doctorSpecialty = (row as any).doctor_specialty || row.doctors?.specialty || ''
    // time formatting: prefer start_time/end_time if present
    const time = row.start_time && row.end_time ?
      `${new Date(row.start_time).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })} - ${new Date(row.end_time).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}` :
      ''

    // Normalize status values from different sources (supabase/backend variations)
    const rawStatus = (row.status ?? '')?.toString?.() || ''
    const normalized = rawStatus.trim().toLowerCase()
    const normalizeStatus = (s: string) => {
      if (!s) return 'scheduled'
      // common variants
      if (s === 'canceled' || s === 'cancel') return 'cancelled'
      if (s === 'no_show' || s === 'no show' || s === 'noshow') return 'no-show'
  // accept 'missed' as legacy input but normalize to 'no-show'
      // ensure known statuses return their canonical form
      switch (s) {
        case 'scheduled': return 'scheduled'
        case 'confirmed': return 'confirmed'
        case 'checked-in': return 'checked-in'
        case 'checked_in': return 'checked-in'
        case 'in-progress': return 'in-progress'
        case 'in_progress': return 'in-progress'
        case 'completed': return 'completed'
        case 'cancelled': return 'cancelled'
  case 'no-show': return 'no-show'
  case 'missed': return 'no-show'
        default: return s
      }
    }

    const statusCanon = normalizeStatus(normalized) as Appointment['status']

    return {
      id: row.id.toString(),
      clinicName,
      doctorName,
  // Use explicit start_time if available, otherwise use the computed preferred date
  date: row.start_time ? new Date(row.start_time) : date,
      time,
      status: statusCanon || 'scheduled',
      specialization,
      doctorSpecialty,
      clinicType,
      address: (row as any).clinic_address || '',
      notes: row.treatment_summary || undefined,

      // raw DB fields for actions
      patient_id: row.patient_id,
      doctor_id: row.doctor_id,
      clinic_id: row.clinic_id,
      time_slot_id: row.time_slot_id,
      treatment_summary: row.treatment_summary,
      created_at: row.created_at ?? '',
      updated_at: row.updated_at ?? ''
    } as unknown as Appointment
  }

  // Fetch appointments for current patient from Supabase
  const fetchPatientAppointments = async () => {
    try {
      loading.value = true
      appointments.value = []
      console.log('fetchPatientAppointments: currentUser=', JSON.parse(JSON.stringify(currentUser.value)))
      // Log Supabase URL so we can confirm which project we're hitting
      try { console.log('Supabase URL:', (import.meta.env.VITE_SUPABASE_URL ?? 'MISSING')) } catch (e) { /* ignore */ }

      // Resolve patient id: prefer currentUser.patient.id; if not present, try fetching patients row by user_id
      let pId: number | null = null
      try {
        if (currentUser.value?.patient?.id) {
          pId = currentUser.value.patient.id
          console.log('Resolved patient id from currentUser.patient.id =', pId)
        } else if (currentUser.value?.profile?.id) {
          // profile.id is not necessarily the patient id; we'll still try to find a patient row by auth user id
          // Attempt to look up patient by auth user id (string)
          const authUserId = currentUser.value?.id
          if (authUserId) {
            console.log('Attempting patient lookup by auth user id:', authUserId)
            const { data: pRow, error: pErr } = await supabase
              .from('patients')
              .select('id, user_id')
              .eq('user_id', authUserId)
              .maybeSingle()

            if (pErr) console.warn('Error fetching patient row by user_id fallback:', pErr)
            console.log('patient lookup result:', pRow)
            if (pRow && (pRow as any).id) {
              pId = (pRow as any).id
              console.log('Resolved patient id from patients table =', pId)
            }
          }
        }
      } catch (err) {
        console.warn('Error resolving patient id:', err)
      }

      if (!pId) {
        console.log('No patient id resolved for currentUser; skipping appointments fetch', currentUser.value)
        return
      }

      console.log('Will query appointments for patient_id =', pId)

      // FIRST: call backend endpoint which queries the DB server-side (safer and avoids RLS issues)
      try {
        const env = (import.meta.env as any)
        const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
        const endpoint = `${apiBase.replace(/\/+$/, '')}/patient/appointments`
        const token = await getAccessToken()
        console.log('Calling backend endpoint', endpoint, 'with token?', !!token)

        const r = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })

        if (r.ok) {
          const backendData = await r.json()
          console.log('Backend returned', (backendData ?? []).length, 'appointments:', backendData)
          if (backendData && (backendData ?? []).length > 0) {
            // Use backend rows directly
            appointments.value = (backendData as any[]).map(r => {
              try { return mapRowToView(r) } catch (err) { console.warn('mapRowToView failed for backend row', err, r); return null }
            }).filter(Boolean) as Appointment[]
            console.log('Loaded appointments from backend, count=', appointments.value.length)
            // Debug: log status counts to help troubleshoot missing statuses
            try {
              const counts: Record<string, number> = appointments.value.reduce((m: Record<string, number>, a) => {
                const s = a.status || 'unknown'
                m[s] = (m[s] || 0) + 1
                return m
              }, {})
              console.log('Appointment status counts (backend):', counts)
            } catch (e) {
              console.warn('Failed to compute appointment status counts:', e)
            }
            return
          }
        } else {
          const txt = await r.text().catch(() => '')
          console.warn('Backend /patient/appointments returned non-OK', r.status, txt)
        }
      } catch (backendErr) {
        console.warn('Backend appointments endpoint failed:', backendErr)
      }

      // FALLBACK: Query Supabase directly if backend yields nothing
      // Query appointments and join clinic/doctor names (if available)
      // Use created_at ordering (start_time may not exist in DB schema)
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, clinics:clinics(*), doctors:doctors(*)`)
        .eq('patient_id', pId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching patient appointments from Supabase:', error)
        return
      }

      console.log('Supabase returned rows count =', (data ?? []).length, 'raw rows:', data)

      // If no rows, run extra debug queries to help diagnose: list first 5 appointments and try id=11
      if ((data ?? []).length === 0) {
        try {
          const { data: someRows, error: someErr } = await supabase
            .from('appointments')
            .select('*')
            .limit(5)

          console.log('Debug: first 5 appointments (no filter):', someRows, someErr)
        } catch (err) {
          console.warn('Debug list query failed:', err)
        }

        try {
          const { data: id11, error: idErr } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', 11)
            .maybeSingle()

          console.log('Debug: appointment id=11 result:', id11, idErr)
        } catch (err) {
          console.warn('Debug id=11 query failed:', err)
        }
      }

  const rows = data ?? []
      appointments.value = rows.map(r => {
        try {
          const mapped = mapRowToView(r as any)
          console.log('Mapped row ->', mapped)
          return mapped
        } catch (mapErr) {
          console.warn('Mapping row failed:', mapErr, 'row:', r)
          return null as any
        }
      }).filter(Boolean)
      console.log(`Loaded ${appointments.value.length} appointments for patient id ${pId}`, appointments.value)
      // Debug: log status counts for supabase fallback
      try {
        const counts: Record<string, number> = appointments.value.reduce((m: Record<string, number>, a) => {
          const s = a.status || 'unknown'
          m[s] = (m[s] || 0) + 1
          return m
        }, {})
        console.log('Appointment status counts (supabase):', counts)
      } catch (e) {
        console.warn('Failed to compute appointment status counts (supabase):', e)
      }
    } catch (err) {
      console.error('Unexpected error fetching appointments:', err)
    } finally {
      loading.value = false
    }
  }

  // Available time slots for rescheduling
  const availableTimeSlots = ref<TimeSlot[]>([
    { id: '1', time: '09:00 AM', available: true },
    { id: '2', time: '09:30 AM', available: true },
    { id: '3', time: '10:00 AM', available: false },
    { id: '4', time: '10:30 AM', available: true },
    { id: '5', time: '11:00 AM', available: true },
    { id: '6', time: '11:30 AM', available: false },
    { id: '7', time: '02:00 PM', available: true },
    { id: '8', time: '02:30 PM', available: true },
    { id: '9', time: '03:00 PM', available: true },
    { id: '10', time: '03:30 PM', available: false },
    { id: '11', time: '04:00 PM', available: true },
    { id: '12', time: '04:30 PM', available: true }
  ])

  // Computed properties to separate appointments
  // Sort controls: allow UI to set sort order independently for upcoming and past lists
  // 'asc' = oldest first, 'desc' = newest first
  const upcomingSortOrder = ref<'asc' | 'desc'>('asc')
  const pastSortOrder = ref<'asc' | 'desc'>('desc')

  const toggleUpcomingSortOrder = () => {
    upcomingSortOrder.value = upcomingSortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  const togglePastSortOrder = () => {
    pastSortOrder.value = pastSortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  const scheduledAppointments = computed(() => {
    const now = new Date()
    // Upcoming: include scheduled, confirmed and checked-in appointments with start >= now
    const list = appointments.value
      .filter(appointment => (appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'checked-in') && appointment.date >= now)

    return list.sort((a, b) => {
      return upcomingSortOrder.value === 'asc'
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime()
    })
  })

  const pastAppointments = computed(() => {
    const now = new Date()
    // Past: include completed, cancelled and no-show (formerly called "missed")
    const list = appointments.value
      .filter(appointment => ['completed', 'cancelled', 'no-show'].includes(appointment.status))

    return list.sort((a, b) => {
      return pastSortOrder.value === 'asc'
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime()
    })
  })

  const availableSlots = computed(() => {
    return availableTimeSlots.value.filter(slot => slot.available)
  })

  // Reschedule dialog state
  const isRescheduleDialogOpen = ref(false)
  const appointmentToReschedule = ref<Appointment | null>(null)
  const selectedDate = ref<CalendarDate>()
  const selectedTimeSlot = ref<TimeSlot | null>(null)

  // Cancel dialog state
  const isCancelDialogOpen = ref(false)
  const appointmentToCancel = ref<Appointment | null>(null)

  // Actions
  const openRescheduleDialog = (appointment: Appointment) => {
    appointmentToReschedule.value = appointment
    // Set current appointment date and time as default
    // Use Asia/Singapore timezone to derive the calendar date so the calendar highlights
    // the correct day regardless of the browser's local timezone.
    const sgDateStr = new Date(appointment.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    const currentDate = parseDate(sgDateStr)
    selectedDate.value = currentDate
    selectedTimeSlot.value = availableSlots.value.find(slot => slot.time === appointment.time) || null
    isRescheduleDialogOpen.value = true
  }

  const closeRescheduleDialog = () => {
    isRescheduleDialogOpen.value = false
    appointmentToReschedule.value = null
    selectedDate.value = undefined
    selectedTimeSlot.value = null
  }

  const openCancelDialog = (appointment: Appointment) => {
    appointmentToCancel.value = appointment
    isCancelDialogOpen.value = true
  }

  const closeCancelDialog = () => {
    isCancelDialogOpen.value = false
    appointmentToCancel.value = null
  }

  const selectDate = (date: DateValue | undefined) => {
    if (date && date instanceof CalendarDate) {
      selectedDate.value = date
      // Reset time slot when date changes
      selectedTimeSlot.value = null
    }
  }

  const selectTimeSlot = (slot: TimeSlot) => {
    selectedTimeSlot.value = slot
  }

  const rescheduleAppointment = async () => {
    if (!appointmentToReschedule.value || !selectedDate.value || !selectedTimeSlot.value) {
      return false
    }

    try {
      // Simulate API call
      console.log('Rescheduling appointment:', {
        appointmentId: appointmentToReschedule.value.id,
        newDate: selectedDate.value.toDate(getLocalTimeZone()),
        newTime: selectedTimeSlot.value.time
      })

      // Update the appointment in our local data
      const appointmentIndex = appointments.value.findIndex(
        app => app.id === appointmentToReschedule.value!.id
      )
      if (appointmentIndex !== -1) {
        appointments.value[appointmentIndex] = {
          ...appointments.value[appointmentIndex],
          date: selectedDate.value.toDate(getLocalTimeZone()),
          time: selectedTimeSlot.value.time
        }
      }

      closeRescheduleDialog()
      return true
    } catch (error) {
      console.error('Reschedule failed:', error)
      return false
    }
  }

  const cancelAppointment = async () => {
    if (!appointmentToCancel.value) {
      return false
    }

    try {
      // Call backend API to cancel the appointment so DB is updated server-side
      const env = (import.meta.env as any)
      const apiBase = (env.VITE_API_BASE_URL as string) || (window as any).API_BASE_URL || '/api'
      const endpoint = `${apiBase.replace(/\/+$/, '')}/appointments/${appointmentToCancel.value.id}`
      const token = await getAccessToken()

      console.log('Cancelling appointment via API', endpoint)

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.warn('Cancel API returned non-OK', res.status, txt)
        throw new Error(`Failed to cancel appointment: ${res.status}`)
      }

      // Refetch appointments from backend to keep UI authoritative
      try {
        await fetchPatientAppointments()
      } catch (e) {
        // If refetch fails, fall back to optimistic local update
        const appointmentIndex = appointments.value.findIndex(
          app => app.id === appointmentToCancel.value!.id
        )
        if (appointmentIndex !== -1) {
          appointments.value[appointmentIndex] = {
            ...appointments.value[appointmentIndex],
            status: 'cancelled'
          }
        }
      }

      closeCancelDialog()
      return true
    } catch (error) {
      console.error('Cancel failed:', error)
      // As a fallback, try marking locally (without persisting) so UI reflects the action
      try {
        const appointmentIndex = appointments.value.findIndex(
          app => app.id === appointmentToCancel.value!.id
        )
        if (appointmentIndex !== -1) {
          appointments.value[appointmentIndex] = {
            ...appointments.value[appointmentIndex],
            status: 'cancelled'
          }
        }
        closeCancelDialog()
      } catch (e) { /* ignore */ }
      return false
    }
  }

  // Load appointments on mount and when auth changes
  onMounted(() => {
    fetchPatientAppointments().catch(err => console.warn('fetchPatientAppointments failed:', err))
  })

  watch(() => currentUser.value, (v) => {
    fetchPatientAppointments().catch(err => console.warn('fetchPatientAppointments failed on auth change:', err))
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: Appointment['status']) => {
    // Colors mapped as requested by product: confirmed=green, scheduled=blue,
  // cancelled=light-gray, no-show=red, completed=emerald green
    switch (status) {
      case 'confirmed':
        // green (success)
        return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled':
        // blue (info)
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        // light gray (neutral)
        return 'bg-gray-50 text-gray-600 border-gray-100'
      case 'no-show':
        // no-show appointments shown as red (danger)
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        // completed — use emerald for completed(success/completed)
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canRescheduleOrCancel = computed(() => {
    return selectedDate.value && selectedTimeSlot.value
  })

  return {
    // State
    appointments,
    scheduledAppointments,
    pastAppointments,
    availableSlots,
    loading,
    
    // Reschedule dialog
    isRescheduleDialogOpen,
    appointmentToReschedule,
    selectedDate,
    selectedTimeSlot,
    
    // Cancel dialog
    isCancelDialogOpen,
    appointmentToCancel,
    
    // Computed
    canRescheduleOrCancel,
  // Sort controls (can be used on same line as status filter)
  upcomingSortOrder,
  toggleUpcomingSortOrder,
  pastSortOrder,
  togglePastSortOrder,
    
    // Actions
    openRescheduleDialog,
    closeRescheduleDialog,
    openCancelDialog,
    closeCancelDialog,
    selectDate,
    selectTimeSlot,
    rescheduleAppointment,
    cancelAppointment,
    formatDate,
    getStatusColor
    ,
    // Expose fetch for explicit page-level calls
    fetchPatientAppointments
  }
}
