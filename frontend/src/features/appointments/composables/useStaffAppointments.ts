import { ref, computed, onMounted, watch } from 'vue'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'
import { doctorsApi } from '@/services/doctorsApi'
import { appointmentsApi } from '@/services/appointmentsApi'

const { currentUser, initializeAuth } = useAuth()

// Type aliases from database
type Doctor = Tables<'doctors'>
type AppointmentStatus = 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'

// Extended appointment interface for staff view
export interface StaffAppointment {
  id: number
  patientName: string
  patientId: number
  doctorName: string
  doctorId: number
  time: string
  duration: number // in minutes
  type: string
  status: AppointmentStatus
  queueNumber?: number
  notes?: string
  patientPhone?: string
  specialInstructions?: string
  checkInTime?: string
  completedTime?: string
  // Database fields (optional for UI mock data)
  clinic_id?: number | null
  time_slot_id?: number | null
  treatment_summary?: string | null
  created_at?: string
  updated_at?: string
}

// Extended doctor interface for staff view
export interface StaffDoctor extends Doctor {
  color: string // for UI theming
}

export interface TimeSlot {
  time: string
  hour: number
  minute: number
}

export const useStaffAppointments = () => {
  const { updatePatientStatus } = useQueueManagement()

  // Generate time slots for the day (8 AM to 6 PM, every 30 minutes)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 6:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          hour,
          minute
        })
      }
    }
    return slots
  }

  const timeSlots = ref<TimeSlot[]>(generateTimeSlots())
  // Reactive states
  const doctors = ref<Doctor[]>([])

  // Fetch doctors for the current staff's clinic
  const fetchDoctors = async (clinicId: number) => {
    try {
      console.log('Fetching doctors for clinic ID:', clinicId)
      const data = await doctorsApi.getDoctorsByClinicId(clinicId)
      doctors.value = data.map((doc, index) => ({
        ...doc,
        color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][index % 5],
      })) as any
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  onMounted(async () => {
    // Ensure the auth state is initialized
    await initializeAuth()

    // Watch for currentUser to be ready and contain staff data
    watch(
      () => currentUser.value,
      (user) => {
        if (user?.staff?.clinic_id) {
          const staffId = user.staff.id
          const clinicId = user.staff.clinic_id
          console.log('Auth loaded. Staff ID:', staffId)
          console.log('Clinic ID:', clinicId)
          fetchDoctors(clinicId)
        } else {
          console.warn('Waiting for staff info to be available...')
        }
      },
      { immediate: true } // run instantly if already loaded
    )
  })


  // fetch appointments
  const todaysAppointments = ref<StaffAppointment[]>([])


  const fetchTodaysAppointments = async (clinicId: number) => {
    try {
      // Fetch today's appointments with all enriched data from the backend
      const data = await appointmentsApi.getTodaysClinicAppointments(clinicId)

      // Map to the StaffAppointment interface expected by the UI
      todaysAppointments.value = data.map((appt) => {
        // Parse timestamps for formatting
        const start = appt.startTime ? new Date(appt.startTime) : null
        const timeStr = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'

        return {
          id: appt.id,
          patientId: appt.patientId,
          patientName: appt.patientName,
          patientPhone: appt.patientPhone,
          doctorId: appt.doctorId,
          doctorName: appt.doctorName,
          type: appt.clinicType,
          time: timeStr,
          duration: appt.durationMinutes ?? 0, // Duration in minutes from backend
          status: appt.status as AppointmentStatus
        }
      })
    } catch (error) {
      console.error("Error fetching today's appointments:", error)
    }
  }

  watch(
    () => currentUser.value,
    (user) => {
      if (user?.staff?.clinic_id) {
        const staffId = user.staff.id
        const clinicId = user.staff.clinic_id
        console.log('Auth loaded. Staff ID:', staffId)
        console.log('Clinic ID:', clinicId)
        fetchDoctors(clinicId)
        fetchTodaysAppointments(clinicId)
      } else {
        console.warn('Waiting for staff info to be available...')
      }
    },
    { immediate: true }
  )



  // Computed properties
  const appointmentsByDoctor = computed(() => {
    const grouped = new Map<number, StaffAppointment[]>()

    todaysAppointments.value.forEach(appointment => {
      const doctorId = appointment.doctorId
      if (!grouped.has(doctorId)) {
        grouped.set(doctorId, [])
      }
      grouped.get(doctorId)!.push(appointment)
    })

    // Sort appointments by time within each doctor group
    grouped.forEach(appointments => {
      appointments.sort((a, b) => a.time.localeCompare(b.time))
    })

    return grouped
  })

  const appointmentsByTimeSlot = computed(() => {
    const slotMap = new Map<string, StaffAppointment[]>()

    todaysAppointments.value.forEach(appointment => {
      const timeSlot = appointment.time
      if (!slotMap.has(timeSlot)) {
        slotMap.set(timeSlot, [])
      }
      slotMap.get(timeSlot)!.push(appointment)
    })

    return slotMap
  })

  const totalAppointments = computed(() => todaysAppointments.value.length)
  const checkedInCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'checked-in').length
  )
  const completedCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'completed').length
  )
  const noShowCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'no-show').length
  )
  const inProgressCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'in-progress').length
  )

  // Actions
  const checkInPatient = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment || appointment.status !== 'scheduled') {
      return false
    }

    try {
      // Update appointment status
      appointment.status = 'checked-in'
      appointment.checkInTime = new Date().toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      // Assign queue number if not exists
      if (!appointment.queueNumber) {
        const maxQueueNumber = Math.max(
          ...todaysAppointments.value
            .filter(apt => apt.queueNumber)
            .map(apt => apt.queueNumber!),
          0
        )
        appointment.queueNumber = maxQueueNumber + 1
      }

      // Update queue management system
      updatePatientStatus(appointment.patientId, 'checked-in')

      return true
    } catch (error) {
      console.error('Check-in failed:', error)
      return false
    }
  }

  const markNoShow = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment) {
      return false
    }

    try {
      appointment.status = 'no-show'

      // Update queue management system
      updatePatientStatus(appointment.patientId, 'no-show')

      return true
    } catch (error) {
      console.error('Mark no-show failed:', error)
      return false
    }
  }

  const markCompleted = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment) {
      return false
    }

    try {
      appointment.status = 'completed'
      appointment.completedTime = new Date().toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      // Update queue management system
      updatePatientStatus(appointment.patientId, 'completed')

      return true
    } catch (error) {
      console.error('Mark completed failed:', error)
      return false
    }
  }

  const cancelAppointment = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment) {
      return false
    }

    try {
      appointment.status = 'cancelled'
      return true
    } catch (error) {
      console.error('Cancel appointment failed:', error)
      return false
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const isTimeSlotBusy = (timeSlot: string) => {
    return appointmentsByTimeSlot.value.has(timeSlot)
  }

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const isCurrentTimeSlot = (timeSlot: string) => {
    const current = getCurrentTime()
    const [currentHour, currentMinute] = current.split(':').map(Number)
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)

    const currentTotalMinutes = currentHour * 60 + currentMinute
    const slotTotalMinutes = slotHour * 60 + slotMinute

    // Consider it current if within 30 minutes window
    return Math.abs(currentTotalMinutes - slotTotalMinutes) <= 30
  }

  return {
    // Data
    todaysAppointments,
    doctors,
    timeSlots,

    // Computed
    appointmentsByDoctor,
    appointmentsByTimeSlot,
    totalAppointments,
    checkedInCount,
    completedCount,
    noShowCount,
    inProgressCount,

    // Actions
    checkInPatient,
    markNoShow,
    markCompleted,
    cancelAppointment,

    // Utilities
    formatTime,
    isTimeSlotBusy,
    getCurrentTime,
    isCurrentTimeSlot
  }
}

