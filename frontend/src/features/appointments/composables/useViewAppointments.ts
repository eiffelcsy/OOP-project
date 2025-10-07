import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import { CalendarDate, parseDate, getLocalTimeZone } from '@internationalized/date'
import type { 
  AppointmentWithDetails, 
  TimeSlot, 
  AppointmentStatus 
} from '@/types/database'

// Extended appointment interface for view appointments
export interface ViewAppointment {
  id: number
  clinicName: string
  doctorName: string
  date: Date
  time: string
  status: AppointmentStatus
  specialization: string
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
  const appointments = ref<Appointment[]>([
    {
      id: '1',
      clinicName: 'Singapore General Hospital',
      doctorName: 'Dr. Sarah Lim',
      date: new Date('2025-10-15'),
      time: '10:30 AM',
      status: 'upcoming',
      specialization: 'General Medicine',
      address: 'Outram Road, Singapore 169608',
      notes: 'Annual checkup'
    },
    {
      id: '3',
      clinicName: 'Tan Tock Seng Hospital',
      doctorName: 'Dr. Jennifer Wong',
      date: new Date('2025-09-15'),
      time: '09:30 AM',
      status: 'completed',
      specialization: 'Internal Medicine',
      address: '11 Jalan Tan Tock Seng, Singapore 308433'
    },
    {
      id: '4',
      clinicName: 'National University Hospital',
      doctorName: 'Dr. Rachel Lee',
      date: new Date('2025-09-08'),
      time: '11:00 AM',
      status: 'completed',
      specialization: 'Family Medicine',
      address: '5 Lower Kent Ridge Road, Singapore 119074'
    },
    {
      id: '5',
      clinicName: 'Changi General Hospital',
      doctorName: 'Dr. Kevin Lau',
      date: new Date('2025-08-22'),
      time: '03:00 PM',
      status: 'cancelled',
      specialization: 'General Surgery',
      address: '2 Simei Street 3, Singapore 529889',
      notes: 'Patient cancelled due to scheduling conflict'
    },
  ])

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
  const upcomingAppointments = computed(() => {
    const now = new Date()
    return appointments.value
      .filter(appointment => appointment.status === 'upcoming' && appointment.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  })

  const pastAppointments = computed(() => {
    const now = new Date()
    return appointments.value
      .filter(appointment => 
        (appointment.status === 'completed' || appointment.status === 'cancelled') || 
        (appointment.status === 'upcoming' && appointment.date < now)
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
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
    const currentDate = parseDate(appointment.date.toISOString().split('T')[0])
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
      // Simulate API call
      console.log('Cancelling appointment:', appointmentToCancel.value.id)

      // Update the appointment status in our local data
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
      return true
    } catch (error) {
      console.error('Cancel failed:', error)
      return false
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
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
    upcomingAppointments,
    pastAppointments,
    availableSlots,
    
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
  }
}
