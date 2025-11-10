import { ref, computed, onMounted, watch } from 'vue'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'
import { staffDoctorsApi } from '@/services/staffDoctorsApi'
import { appointmentsApi } from '@/services/appointmentsApi'
import { queueApi } from '@/services/queueApi'
import { queueTicketsApi, type CreateQueueTicketRequest } from '@/services/queueTicketsApi'

const { currentUser, initializeAuth } = useAuth()

// Type aliases from database
type Doctor = Tables<'doctors'>
type AppointmentStatus = 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show'

// Extended appointment interface for staff view
export interface StaffAppointment {
  id: number
  patientName: string
  patientId: number
  patientPhone: string
  doctorId: number
  doctorName: string
  doctorSpecialty: string
  clinicId: number
  clinicName: string
  clinicType: string
  type: string
  date: string
  time: string
  status: AppointmentStatus
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

  // Reactive states
  const doctors = ref<Doctor[]>([])

  // Fetch doctors for the current staff's clinic
  const fetchDoctors = async (clinicId: number) => {
    try {
      console.log('Fetching doctors for clinic ID:', clinicId)
      const data = await staffDoctorsApi.getDoctorsByClinicId(clinicId)
      // .map() loops through the list of doctors returned by your API (data), and for each doctor object
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
        // Parse timestamps for formatting in 24-hour format (HH:mm)
        // The backend returns ISO 8601 strings with timezone info
        const start = appt.start_time
          ? new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
          : null

        const timeStr = start
          ? `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
          : '-'

        const dateStr = start ? start.toISOString().split('T')[0] : '-'

        // Map backend status to frontend status | standardizes those statuses.
        // Backend uses: scheduled, confirmed, cancelled
        // Frontend uses: scheduled, checked-in, completed, cancelled, no-show
        let mappedStatus: AppointmentStatus = 'scheduled'
        if (appt.status) {
          const backendStatus = appt.status.toLowerCase()
          if (backendStatus === 'confirmed' || backendStatus === 'scheduled') {
            mappedStatus = 'scheduled'
          } else if (backendStatus === 'cancelled') {
            mappedStatus = 'cancelled'
          } else if (backendStatus === 'checked-in' ||
            backendStatus === 'completed' || backendStatus === 'no-show') {
            mappedStatus = appt.status as AppointmentStatus
          }
        }

        return {
          id: appt.id,
          patientId: appt.patient_id,
          patientName: appt.patient_name || '-',
          patientPhone: appt.patient_phone || '-',
          doctorId: appt.doctor_id,
          doctorName: appt.doctor_name || '-',
          doctorSpecialty: appt.doctor_specialty || '-',
          clinicId: appt.clinic_id,
          clinicName: appt.clinic_name || '-',
          clinicType: appt.clinic_type || '-',
          type: appt.treatment_summary || 'Consultation',
          date: dateStr,
          time: timeStr,
          status: mappedStatus
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

  // display the value at the top cards
  const totalAppointments = computed(() => todaysAppointments.value.length)
  const checkedInCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'checked-in').length
  )
  const completedCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'completed').length
  )
  const noShowCount = computed(() =>
    todaysAppointments.value.filter(apt => apt.status === 'no-show' || apt.status === 'cancelled' ).length
  )

  // Actions
  const checkInPatient = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment || appointment.status !== 'scheduled') {
      return false
    }

    try {
      console.log('Starting check-in process for appointment:', appointmentId)

      // 1) Update appointment status in backend to 'checked-in'
      await appointmentsApi.updateAppointmentStatus(appointmentId, 'checked-in')

      // 2) Determine the clinic's current queue (ACTIVE preferred, else PAUSED)
      const clinicId = currentUser.value?.staff?.clinic_id
      if (!clinicId) {
        console.warn('Missing clinic_id on current user; cannot check in.')
        return false
      }

      // Try ACTIVE first
      let activeQueue = await queueApi.getActiveQueueByClinicId(clinicId)
      if (!activeQueue) {
        // Fallback to PAUSED (allow check-in even if queue is paused)
        const pausedResult = await queueApi.listQueues({
          clinicId,
          statuses: ['PAUSED'],
          size: 1,
          sortBy: 'created_at',
          sortDir: 'DESC'
        })
        activeQueue = pausedResult.data[0] || null
      }

      if (!activeQueue) {
        console.warn('No ACTIVE or PAUSED queue found for clinic; cannot check in.')
        return false
      }

      // 3) Compute next ticket number by listing current tickets for this queue
      const existingTickets = await queueTicketsApi.list(activeQueue.id)
      const maxNumber = existingTickets.reduce((max, t) => Math.max(max, t.ticket_number || 0), 0)
      const nextNumber = (maxNumber || 0) + 1

      // 4) Create the queue ticket via backend only
      const payload: CreateQueueTicketRequest = {
        queue_id: activeQueue.id,
        appointment_id: appointment.id,
        ticket_number: nextNumber,
        priority: 0,
        ticket_status: 'Checked In',
        called_at: new Date().toISOString(),
        completed_at: null,
        no_show_at: null
      }

      await queueTicketsApi.create(payload)

      // Update appointment status locally
      appointment.status = 'checked-in'

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
      // Update appointment status in backend to 'no-show'
      await appointmentsApi.updateAppointmentStatus(appointmentId, 'no-show')

      // Update appointment status locally
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
      // Update appointment status in backend to 'completed'
      await appointmentsApi.updateAppointmentStatus(appointmentId, 'completed')

      // Update appointment status locally
      appointment.status = 'completed'

      // Update queue management system
      updatePatientStatus(appointment.patientId, 'completed')

      return true
    } catch (error) {
      console.error('Mark completed failed:', error)
      return false
    }
  }

  // converts time from 24-hour format (e.g. "14:30") to 12-hour format with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  return {
    // Data
    todaysAppointments,
    doctors,

    // Computed
    appointmentsByDoctor,
    totalAppointments,
    checkedInCount,
    completedCount,
    noShowCount,

    // Actions
    checkInPatient,
    markNoShow,
    markCompleted,

    // Utilities
    formatTime,
    getCurrentTime,
  }
}

