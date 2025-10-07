import { ref, computed } from 'vue'
import { useQueueManagement } from '@/features/queue/composables/useQueueManagement'
import type { 
  AppointmentWithDetails, 
  Doctor, 
  AppointmentStatus 
} from '@/types/database'

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

  // Sample doctors data
  const doctors = ref<Doctor[]>([
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
      name: 'Dr. Jennifer Wong',
      specialty: 'Internal Medicine',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Dr. Rachel Lee',
      specialty: 'Family Medicine',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Dr. Kevin Lau',
      specialty: 'General Surgery',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Dr. Michael Tan',
      specialty: 'Pediatrics',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])

  // Today's appointments data (simulated for current date)
  const todaysAppointments = ref<StaffAppointment[]>([
    {
      id: 1,
      patientName: 'John Smith',
      patientId: 1,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '09:00',
      duration: 30,
      type: 'General Checkup',
      status: 'checked-in',
      queueNumber: 1,
      patientPhone: '+65 9123 4567',
      notes: 'Regular annual checkup',
      checkInTime: '08:45'
    },
    {
      id: 2,
      patientName: 'Emily Johnson',
      patientId: 2,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '09:30',
      duration: 30,
      type: 'Follow-up',
      status: 'scheduled',
      patientPhone: '+65 8765 4321',
      specialInstructions: 'Patient has anxiety about blood tests'
    },
    {
      id: 3,
      patientName: 'Michael Brown',
      patientId: 3,
      doctorName: 'Dr. Jennifer Wong',
      doctorId: 2,
      time: '10:00',
      duration: 45,
      type: 'Consultation',
      status: 'in-progress',
      queueNumber: 2,
      patientPhone: '+65 9876 5432',
      checkInTime: '09:45'
    },
    {
      id: 4,
      patientName: 'Sarah Davis',
      patientId: 4,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '10:30',
      duration: 30,
      type: 'Blood Test Review',
      status: 'scheduled',
      patientPhone: '+65 8123 4567'
    },
    {
      id: 5,
      patientName: 'Robert Wilson',
      patientId: 5,
      doctorName: 'Dr. Rachel Lee',
      doctorId: 3,
      time: '11:00',
      duration: 30,
      type: 'Vaccination',
      status: 'completed',
      queueNumber: 3,
      patientPhone: '+65 9234 5678',
      checkInTime: '10:45',
      completedTime: '11:25'
    },
    {
      id: 6,
      patientName: 'Lisa Anderson',
      patientId: 6,
      doctorName: 'Dr. Jennifer Wong',
      doctorId: 2,
      time: '11:30',
      duration: 30,
      type: 'General Checkup',
      status: 'scheduled',
      patientPhone: '+65 8345 6789'
    },
    {
      id: 7,
      patientName: 'Thomas Garcia',
      patientId: 7,
      doctorName: 'Dr. Kevin Lau',
      doctorId: 4,
      time: '14:00',
      duration: 60,
      type: 'Pre-surgical Consultation',
      status: 'checked-in',
      queueNumber: 4,
      patientPhone: '+65 9456 7890',
      checkInTime: '13:45',
      specialInstructions: 'Fasting required before surgery'
    },
    {
      id: 8,
      patientName: 'Maria Rodriguez',
      patientId: 8,
      doctorName: 'Dr. Rachel Lee',
      doctorId: 3,
      time: '14:30',
      duration: 30,
      type: 'Follow-up',
      status: 'scheduled',
      patientPhone: '+65 8567 8901'
    },
    {
      id: 9,
      patientName: 'James Taylor',
      patientId: 9,
      doctorName: 'Dr. Michael Tan',
      doctorId: 5,
      time: '15:00',
      duration: 45,
      type: 'Pediatric Checkup',
      status: 'no-show',
      queueNumber: 5,
      patientPhone: '+65 9678 9012',
      notes: 'Child patient, parent required'
    },
    {
      id: 10,
      patientName: 'Amy Chen',
      patientId: 10,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '15:30',
      duration: 30,
      type: 'General Checkup',
      status: 'scheduled',
      patientPhone: '+65 8789 0123'
    },
    {
      id: 11,
      patientName: 'David Kim',
      patientId: 11,
      doctorName: 'Dr. Jennifer Wong',
      doctorId: 2,
      time: '16:00',
      duration: 30,
      type: 'Lab Results Review',
      status: 'scheduled',
      patientPhone: '+65 9890 1234'
    },
    {
      id: 12,
      patientName: 'Sophie Martin',
      patientId: 12,
      doctorName: 'Dr. Kevin Lau',
      doctorId: 4,
      time: '16:30',
      duration: 30,
      type: 'Post-operative Check',
      status: 'scheduled',
      patientPhone: '+65 8901 2345'
    },
    // Additional appointments to demonstrate multiple appointments in same time slots
    {
      id: 13,
      patientName: 'Peter Wong',
      patientId: 13,
      doctorName: 'Dr. Rachel Lee',
      doctorId: 3,
      time: '09:00',
      duration: 30,
      type: 'Blood Pressure Check',
      status: 'scheduled',
      patientPhone: '+65 9012 3456',
      notes: 'Regular monitoring appointment'
    },
    {
      id: 14,
      patientName: 'Linda Tan',
      patientId: 14,
      doctorName: 'Dr. Michael Tan',
      doctorId: 5,
      time: '09:00',
      duration: 45,
      type: 'Child Development Assessment',
      status: 'checked-in',
      queueNumber: 6,
      patientPhone: '+65 8123 4567',
      checkInTime: '08:50',
      specialInstructions: 'Bring child\'s vaccination record'
    },
    {
      id: 15,
      patientName: 'Alex Kumar',
      patientId: 15,
      doctorName: 'Dr. Jennifer Wong',
      doctorId: 2,
      time: '10:30',
      duration: 30,
      type: 'Diabetes Follow-up',
      status: 'scheduled',
      patientPhone: '+65 9234 5678'
    },
    {
      id: 16,
      patientName: 'Grace Lim',
      patientId: 16,
      doctorName: 'Dr. Michael Tan',
      doctorId: 5,
      time: '10:30',
      duration: 30,
      type: 'Pediatric Consultation',
      status: 'in-progress',
      queueNumber: 7,
      patientPhone: '+65 8345 6789',
      checkInTime: '10:15',
      notes: 'First-time patient'
    },
    {
      id: 17,
      patientName: 'Daniel Lee',
      patientId: 17,
      doctorName: 'Dr. Kevin Lau',
      doctorId: 4,
      time: '11:00',
      duration: 60,
      type: 'Surgical Consultation',
      status: 'scheduled',
      patientPhone: '+65 9456 7890',
      specialInstructions: 'Bring previous X-ray results'
    },
    {
      id: 18,
      patientName: 'Michelle Chen',
      patientId: 18,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '14:00',
      duration: 30,
      type: 'Annual Physical',
      status: 'scheduled',
      patientPhone: '+65 8567 8901'
    },
    {
      id: 19,
      patientName: 'Ryan Ng',
      patientId: 19,
      doctorName: 'Dr. Rachel Lee',
      doctorId: 3,
      time: '14:00',
      duration: 30,
      type: 'Allergy Testing',
      status: 'checked-in',
      queueNumber: 8,
      patientPhone: '+65 9678 9012',
      checkInTime: '13:45'
    },
    {
      id: 20,
      patientName: 'Catherine Wee',
      patientId: 20,
      doctorName: 'Dr. Jennifer Wong',
      doctorId: 2,
      time: '15:00',
      duration: 30,
      type: 'Hypertension Review',
      status: 'scheduled',
      patientPhone: '+65 8789 0123'
    },
    {
      id: 21,
      patientName: 'Benjamin Tay',
      patientId: 21,
      doctorName: 'Dr. Kevin Lau',
      doctorId: 4,
      time: '15:00',
      duration: 45,
      type: 'Pre-operative Assessment',
      status: 'scheduled',
      patientPhone: '+65 9890 1234',
      specialInstructions: 'NPO (nothing by mouth) after midnight'
    },
    {
      id: 22,
      patientName: 'Stephanie Goh',
      patientId: 22,
      doctorName: 'Dr. Sarah Lim',
      doctorId: 1,
      time: '16:00',
      duration: 30,
      type: 'Medication Review',
      status: 'scheduled',
      patientPhone: '+65 8901 2345'
    },
    {
      id: 23,
      patientName: 'Marcus Loh',
      patientId: 23,
      doctorName: 'Dr. Rachel Lee',
      doctorId: 3,
      time: '16:00',
      duration: 30,
      type: 'Wound Care Follow-up',
      status: 'completed',
      queueNumber: 9,
      patientPhone: '+65 9012 3456',
      checkInTime: '15:45',
      completedTime: '16:25'
    },
    {
      id: 24,
      patientName: 'Vivian Koh',
      patientId: 24,
      doctorName: 'Dr. Michael Tan',
      doctorId: 5,
      time: '16:30',
      duration: 30,
      type: 'Immunization',
      status: 'scheduled',
      patientPhone: '+65 8123 4567',
      notes: 'HPV vaccine series - dose 2'
    }
  ])

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
