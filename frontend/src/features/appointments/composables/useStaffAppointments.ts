import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'
import type { Tables } from '@/types/supabase'

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
  // Database fields (optional)
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
  const { currentUser } = useAuth()
  const { updatePatientStatus } = useQueueManagement()

  // Reactive state
  const doctors = ref<StaffDoctor[]>([])
  const todaysAppointments = ref<StaffAppointment[]>([]) // initially empty

  // Generate time slots for the day (8 AM to 6 PM, every 30 minutes)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({ time: timeString, hour, minute })
      }
    }
    return slots
  }
  const timeSlots = ref<TimeSlot[]>(generateTimeSlots())

  // Fetch doctors for the current staff's clinic
  const fetchDoctors = async () => {
    if (!currentUser.value?.staff) return
    const clinicId = currentUser.value.staff.clinic_id
    try {
      const res = await fetch(`http://localhost:8080/api/doctors?clinicId=${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')

      const data: Tables<'doctors'>[] = await res.json()
      doctors.value = data.map((doc, index) => ({
        ...doc,
        color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][index % 5]
      }))
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  // --- Computed properties ---
  const appointmentsByDoctor = computed(() => {
    const grouped = new Map<number, StaffAppointment[]>()
    todaysAppointments.value.forEach(appointment => {
      const doctorId = appointment.doctorId
      if (!grouped.has(doctorId)) grouped.set(doctorId, [])
      grouped.get(doctorId)!.push(appointment)
    })
    grouped.forEach(list => list.sort((a, b) => a.time.localeCompare(b.time)))
    return grouped
  })

  const appointmentsByTimeSlot = computed(() => {
    const slotMap = new Map<string, StaffAppointment[]>()
    todaysAppointments.value.forEach(appointment => {
      const slot = appointment.time
      if (!slotMap.has(slot)) slotMap.set(slot, [])
      slotMap.get(slot)!.push(appointment)
    })
    return slotMap
  })

  const totalAppointments = computed(() => todaysAppointments.value.length)
  const checkedInCount = computed(() => todaysAppointments.value.filter(a => a.status === 'checked-in').length)
  const completedCount = computed(() => todaysAppointments.value.filter(a => a.status === 'completed').length)
  const noShowCount = computed(() => todaysAppointments.value.filter(a => a.status === 'no-show').length)
  const inProgressCount = computed(() => todaysAppointments.value.filter(a => a.status === 'in-progress').length)

  // --- Actions ---
  const checkInPatient = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(a => a.id === appointmentId)
    if (!appointment || appointment.status !== 'scheduled') return false
    try {
      appointment.status = 'checked-in'
      appointment.checkInTime = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false })

      if (!appointment.queueNumber) {
        const maxQueue = Math.max(...todaysAppointments.value.filter(a => a.queueNumber).map(a => a.queueNumber!), 0)
        appointment.queueNumber = maxQueue + 1
      }

      updatePatientStatus(appointment.patientId, 'checked-in')
      return true
    } catch (err) {
      console.error('Check-in failed:', err)
      return false
    }
  }

  const markNoShow = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(a => a.id === appointmentId)
    if (!appointment) return false
    try {
      appointment.status = 'no-show'
      updatePatientStatus(appointment.patientId, 'no-show')
      return true
    } catch (err) {
      console.error('Mark no-show failed:', err)
      return false
    }
  }

  const markCompleted = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(a => a.id === appointmentId)
    if (!appointment) return false
    try {
      appointment.status = 'completed'
      appointment.completedTime = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false })
      updatePatientStatus(appointment.patientId, 'completed')
      return true
    } catch (err) {
      console.error('Mark completed failed:', err)
      return false
    }
  }

  const cancelAppointment = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(a => a.id === appointmentId)
    if (!appointment) return false
    try {
      appointment.status = 'cancelled'
      return true
    } catch (err) {
      console.error('Cancel appointment failed:', err)
      return false
    }
  }

  // --- Utilities ---
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const hour12 = hour % 12 || 12
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const isTimeSlotBusy = (timeSlot: string) => appointmentsByTimeSlot.value.has(timeSlot)

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const isCurrentTimeSlot = (timeSlot: string) => {
    const current = getCurrentTime()
    const [currentHour, currentMinute] = current.split(':').map(Number)
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)
    return Math.abs((currentHour * 60 + currentMinute) - (slotHour * 60 + slotMinute)) <= 30
  }

  // Fetch doctors on mounted
  onMounted(() => {
    fetchDoctors()
  })

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
