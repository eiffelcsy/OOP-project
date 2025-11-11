import { ref, computed } from 'vue'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'
import { appointmentsApi, type StaffAppointmentResponse } from '@/services/appointmentsApi'
import { queueTicketsApi, type CreateQueueTicketRequest } from '@/services/queueTicketsApi'
import { queueApi } from '@/services/queueApi'

// Use Supabase types for data model
type Appointment = Tables<'appointments'>
type Patient = Tables<'patients'>
type Doctor = Tables<'doctors'>
type QueueTicket = Tables<'queue_tickets'>

// Type for appointment status (matches database enum)
type AppointmentStatus = 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'

// Dashboard-specific types for UI presentation
interface DashboardAppointment {
  id: number
  patientName: string
  time: string
  type: string
  status: AppointmentStatus
  queueNumber: number | null
  doctor: string
}

interface TodaysOverview {
  totalAppointmentsToday: number
  patientsCheckedIn: number
  currentQueueLength: number
  nextAppointmentTime: string
}

export function useStaffDashboard() {
  const { currentUser } = useAuth()

  // Reactive data
  const todaysOverview = ref<TodaysOverview>({
    totalAppointmentsToday: 0,
    patientsCheckedIn: 0,
    currentQueueLength: 0,
    nextAppointmentTime: '-'
  })

  const todaysAppointments = ref<DashboardAppointment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper to get clinic ID from current user
  const getClinicId = (): number => {
    const clinicId = currentUser.value?.staff?.clinic_id
    if (!clinicId) {
      throw new Error('User is not associated with any clinic. Please contact your administrator.')
    }
    return clinicId
  }

  // Fetch queue tickets to map queue numbers to appointments
  const fetchQueueTicketsForAppointments = async (appointmentIds: number[], queueId: number | null): Promise<Map<number, number>> => {
    const queueNumberMap = new Map<number, number>()
    
    if (!queueId || appointmentIds.length === 0) {
      return queueNumberMap
    }

    try {
      const tickets = await queueTicketsApi.list(queueId)
      tickets.forEach(ticket => {
        if (ticket.appointment_id && appointmentIds.includes(ticket.appointment_id)) {
          queueNumberMap.set(ticket.appointment_id, ticket.ticket_number || 0)
        }
      })
    } catch (err) {
      console.error('Error fetching queue tickets:', err)
    }

    return queueNumberMap
  }

  // Fetch today's appointments from API
  const fetchTodaysAppointments = async () => {
    try {
      loading.value = true
      error.value = null

      const clinicId = getClinicId()

      // Fetch today's appointments
      const data = await appointmentsApi.getTodaysClinicAppointments(clinicId)

      // Get current queue to fetch queue tickets
      let queueId: number | null = null
      try {
        const activeQueue = await queueApi.getActiveQueueByClinicId(clinicId)
        if (!activeQueue) {
          const pausedResult = await queueApi.listQueues({
            clinicId,
            statuses: ['PAUSED'],
            size: 1,
            sortBy: 'created_at',
            sortDir: 'DESC'
          })
          queueId = pausedResult.data?.[0]?.id || null
        } else {
          queueId = activeQueue.id
        }
      } catch (err) {
        console.warn('Could not fetch queue for queue numbers:', err)
      }

      // Fetch queue tickets to get queue numbers
      const appointmentIds = data.map(a => a.id)
      const queueNumberMap = await fetchQueueTicketsForAppointments(appointmentIds, queueId)

      // Map API response to DashboardAppointment format
      todaysAppointments.value = data.map((appt: StaffAppointmentResponse) => {
        // Parse timestamps for formatting
        const start = appt.start_time
          ? new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
          : null

        const timeStr = start
          ? start.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          : '-'

        // Map backend status to frontend status
        let mappedStatus: AppointmentStatus = 'scheduled'
        if (appt.status) {
          const backendStatus = appt.status.toLowerCase()
          if (backendStatus === 'confirmed' || backendStatus === 'scheduled') {
            mappedStatus = 'scheduled'
          } else if (backendStatus === 'cancelled') {
            mappedStatus = 'cancelled'
          } else if (['checked-in', 'completed', 'no-show', 'in-progress'].includes(backendStatus)) {
            mappedStatus = backendStatus as AppointmentStatus
          }
        }

        return {
          id: appt.id,
          patientName: appt.patient_name || '-',
          time: timeStr,
          type: appt.treatment_summary || 'Consultation',
          status: mappedStatus,
          queueNumber: queueNumberMap.get(appt.id) || null,
          doctor: appt.doctor_name || '-'
        }
      })

      // Update overview statistics
      updateOverviewStatistics()
    } catch (err: any) {
      console.error('Error fetching today\'s appointments:', err)
      error.value = err.message || 'Failed to fetch appointments'
    } finally {
      loading.value = false
    }
  }

  // Update overview statistics from current appointments data
  const updateOverviewStatistics = () => {
    const appointments = todaysAppointments.value
    
    todaysOverview.value.totalAppointmentsToday = appointments.length
    todaysOverview.value.patientsCheckedIn = appointments.filter(apt => apt.status === 'checked-in').length
    
    // Find next upcoming appointment (scheduled status, time in future)
    const now = new Date()
    const upcoming = appointments
      .filter(apt => apt.status === 'scheduled' && apt.time !== '-')
      .sort((a, b) => {
        // Sort by time
        const timeA = parseTimeString(a.time)
        const timeB = parseTimeString(b.time)
        if (!timeA || !timeB) return 0
        return timeA.getTime() - timeB.getTime()
      })
      .find(apt => {
        const aptTime = parseTimeString(apt.time)
        return aptTime && aptTime > now
      })

    if (upcoming) {
      todaysOverview.value.nextAppointmentTime = upcoming.time
    } else {
      todaysOverview.value.nextAppointmentTime = '-'
    }
  }

  // Helper to parse time string (e.g., "2:30 PM") to Date
  const parseTimeString = (timeStr: string): Date | null => {
    if (timeStr === '-') return null
    
    try {
      const [time, period] = timeStr.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours, 10)
      const min = parseInt(minutes, 10)
      
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const today = new Date()
      today.setHours(hour, min, 0, 0)
      return today
    } catch {
      return null
    }
  }

  // Computed properties
  const queueWaitingList = computed(() => {
    return todaysAppointments.value.filter(apt => apt.status === 'checked-in')
  })

  const upcomingAppointments = computed(() => {
    return todaysAppointments.value.filter(apt => apt.status === 'scheduled')
  })

  // Appointment Actions
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
      const clinicId = getClinicId()

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
        activeQueue = pausedResult.data?.[0] || null
      }

      if (!activeQueue) {
        console.warn('No ACTIVE or PAUSED queue found for clinic; cannot check in.')
        error.value = 'No active queue found. Please start a queue first.'
        return false
      }

      // 3) Compute next ticket number by listing current tickets for this queue
      const existingTickets = await queueTicketsApi.list(activeQueue.id)
      const maxNumber = existingTickets.reduce((max, t) => Math.max(max, t.ticket_number || 0), 0)
      const nextNumber = (maxNumber || 0) + 1

      // 4) Create the queue ticket via backend
      const payload: CreateQueueTicketRequest = {
        queue_id: activeQueue.id,
        appointment_id: appointment.id,
        ticket_number: nextNumber,
        priority: 0,
        ticket_status: 'Checked In',
        called_at: null, // Not called yet, just checked in
        completed_at: null,
        no_show_at: null
      }

      await queueTicketsApi.create(payload)

      // Update local state
      appointment.status = 'checked-in'
      updateOverviewStatistics()
      
      // Refresh appointments to get updated queue numbers
      await fetchTodaysAppointments()
      
      return true
    } catch (err: any) {
      console.error('Check-in failed:', err)
      error.value = err.message || 'Failed to check in patient'
      return false
    }
  }

  const markNoShow = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment) {
      return false
    }

    try {
      // Update appointment status in backend
      await appointmentsApi.updateAppointmentStatus(appointmentId, 'no-show')
      
      // Update local state
      appointment.status = 'no-show'
      updateOverviewStatistics()
      
      return true
    } catch (err: any) {
      console.error('Mark no-show failed:', err)
      error.value = err.message || 'Failed to mark as no-show'
      return false
    }
  }

  const cancelAppointment = async (appointmentId: number) => {
    const appointmentIndex = todaysAppointments.value.findIndex(apt => apt.id === appointmentId)
    if (appointmentIndex === -1) {
      return false
    }

    try {
      // Cancel appointment in backend
      await appointmentsApi.cancelAppointment(appointmentId)
      
      // Remove from local state
      todaysAppointments.value.splice(appointmentIndex, 1)
      updateOverviewStatistics()
      
      return true
    } catch (err: any) {
      console.error('Cancel appointment failed:', err)
      error.value = err.message || 'Failed to cancel appointment'
      return false
    }
  }

  const rescheduleAppointment = async (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (!appointment) {
      return false
    }

    // For now, just show an alert - rescheduling UI can be implemented later
    alert(`Reschedule appointment for ${appointment.patientName} - Feature coming soon!`)
    return false
  }

  // Utility functions
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; class: string }> = {
      'scheduled': { 
        label: 'Scheduled', 
        class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
      },
      'checked-in': { 
        label: 'Checked In', 
        class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
      },
      'completed': { 
        label: 'Completed', 
        class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      },
      'no-show': { 
        label: 'No Show', 
        class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
      },
      'cancelled': { 
        label: 'Cancelled', 
        class: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' 
      },
      'in-progress': { 
        label: 'In Progress', 
        class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
      }
    }
    return configs[status] || configs.scheduled
  }

  return {
    // Data
    todaysOverview,
    todaysAppointments,
    loading,
    error,
    
    // Computed
    queueWaitingList,
    upcomingAppointments,
    
    // Actions
    fetchTodaysAppointments,
    checkInPatient,
    markNoShow,
    cancelAppointment,
    rescheduleAppointment,
    
    // Utilities
    getStatusConfig
  }
}

