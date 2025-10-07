import { ref, computed } from 'vue'
import type { AppointmentStatus } from '@/types/database'

// Types
interface DashboardAppointment {
  id: number
  patientName: string
  time: string
  type: string
  status: AppointmentStatus
  queueNumber: number
  doctor: string
}

interface TodaysOverview {
  totalAppointmentsToday: number
  patientsCheckedIn: number
  currentQueueLength: number
  nextAppointmentTime: string
}

interface QueueControl {
  nowServing: number
  patientsWaiting: number
  queueStatus: 'active' | 'paused' | 'stopped'
  lastCalledTime: string
}

export function useStaffDashboard() {
  // Reactive data
  const todaysOverview = ref<TodaysOverview>({
    totalAppointmentsToday: 42,
    patientsCheckedIn: 28,
    currentQueueLength: 8,
    nextAppointmentTime: '2:30 PM'
  })

  const queueControl = ref<QueueControl>({
    nowServing: 5,
    patientsWaiting: 8,
    queueStatus: 'active',
    lastCalledTime: '2:15 PM'
  })

  const todaysAppointments = ref<DashboardAppointment[]>([
    {
      id: 1,
      patientName: 'Sarah Johnson',
      time: '9:00 AM',
      type: 'General Checkup',
      status: 'completed',
      queueNumber: 1,
      doctor: 'Dr. Smith'
    },
    {
      id: 2,
      patientName: 'Michael Chen',
      time: '9:30 AM',
      type: 'Follow-up',
      status: 'completed',
      queueNumber: 2,
      doctor: 'Dr. Johnson'
    },
    {
      id: 3,
      patientName: 'Emily Davis',
      time: '10:00 AM',
      type: 'Consultation',
      status: 'checked-in',
      queueNumber: 3,
      doctor: 'Dr. Smith'
    },
    {
      id: 4,
      patientName: 'Robert Wilson',
      time: '10:30 AM',
      type: 'General Checkup',
      status: 'checked-in',
      queueNumber: 4,
      doctor: 'Dr. Johnson'
    },
    {
      id: 5,
      patientName: 'Jessica Brown',
      time: '11:00 AM',
      type: 'Blood Test',
      status: 'checked-in',
      queueNumber: 5,
      doctor: 'Dr. Smith'
    },
    {
      id: 6,
      patientName: 'David Miller',
      time: '11:30 AM',
      type: 'X-Ray Review',
      status: 'scheduled',
      queueNumber: 6,
      doctor: 'Dr. Johnson'
    },
    {
      id: 7,
      patientName: 'Lisa Anderson',
      time: '2:00 PM',
      type: 'Vaccination',
      status: 'scheduled',
      queueNumber: 7,
      doctor: 'Dr. Smith'
    },
    {
      id: 8,
      patientName: 'Thomas Garcia',
      time: '2:30 PM',
      type: 'General Checkup',
      status: 'scheduled',
      queueNumber: 8,
      doctor: 'Dr. Johnson'
    },
    {
      id: 9,
      patientName: 'Maria Rodriguez',
      time: '3:00 PM',
      type: 'Follow-up',
      status: 'scheduled',
      queueNumber: 9,
      doctor: 'Dr. Smith'
    },
    {
      id: 10,
      patientName: 'James Taylor',
      time: '3:30 PM',
      type: 'Consultation',
      status: 'no-show',
      queueNumber: 10,
      doctor: 'Dr. Johnson'
    }
  ])

  // Computed properties
  const queueWaitingList = computed(() => {
    return todaysAppointments.value.filter(apt => apt.status === 'checked-in')
  })

  const upcomingAppointments = computed(() => {
    return todaysAppointments.value.filter(apt => apt.status === 'scheduled')
  })

  // Queue Control Functions
  const callNext = () => {
    if (queueWaitingList.value.length > 0) {
      const nextPatient = queueWaitingList.value[0]
      queueControl.value.nowServing = nextPatient.queueNumber
      queueControl.value.lastCalledTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      
      // Update appointment status to completed for demonstration
      const appointmentIndex = todaysAppointments.value.findIndex(apt => apt.id === nextPatient.id)
      if (appointmentIndex !== -1) {
        todaysAppointments.value[appointmentIndex].status = 'completed'
      }
      
      // Update queue metrics
      todaysOverview.value.patientsCheckedIn++
      todaysOverview.value.currentQueueLength--
      queueControl.value.patientsWaiting--
    }
  }

  const startQueue = () => {
    queueControl.value.queueStatus = 'active'
  }

  const pauseQueue = () => {
    queueControl.value.queueStatus = 'paused'
  }

  const stopQueue = () => {
    queueControl.value.queueStatus = 'stopped'
  }

  // Appointment Actions
  const checkInPatient = (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (appointment && appointment.status === 'scheduled') {
      appointment.status = 'checked-in'
      todaysOverview.value.patientsCheckedIn++
      todaysOverview.value.currentQueueLength++
      queueControl.value.patientsWaiting++
    }
  }

  const markNoShow = (appointmentId: number) => {
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (appointment) {
      appointment.status = 'no-show'
    }
  }

  const cancelAppointment = (appointmentId: number) => {
    const appointmentIndex = todaysAppointments.value.findIndex(apt => apt.id === appointmentId)
    if (appointmentIndex !== -1) {
      todaysAppointments.value.splice(appointmentIndex, 1)
      todaysOverview.value.totalAppointmentsToday--
    }
  }

  const rescheduleAppointment = (appointmentId: number) => {
    // For demo purposes, just show an alert
    const appointment = todaysAppointments.value.find(apt => apt.id === appointmentId)
    if (appointment) {
      alert(`Reschedule appointment for ${appointment.patientName} - Feature coming soon!`)
    }
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
      }
    }
    return configs[status] || configs.scheduled
  }

  const getQueueStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; class: string; icon: string }> = {
      'active': { 
        label: 'Active', 
        class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: 'lucide:play-circle'
      },
      'paused': { 
        label: 'Paused', 
        class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: 'lucide:pause-circle'
      },
      'stopped': { 
        label: 'Stopped', 
        class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: 'lucide:stop-circle'
      }
    }
    return configs[status] || configs.active
  }

  return {
    // Data
    todaysOverview,
    queueControl,
    todaysAppointments,
    
    // Computed
    queueWaitingList,
    upcomingAppointments,
    
    // Queue Actions
    callNext,
    startQueue,
    pauseQueue,
    stopQueue,
    
    // Appointment Actions
    checkInPatient,
    markNoShow,
    cancelAppointment,
    rescheduleAppointment,
    
    // Utilities
    getStatusConfig,
    getQueueStatusConfig
  }
}

