import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'

// Type aliases from database
type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Walk-in patient data interface
interface WalkInPatientData {
  name: string
  phone: string
  nric: string
  email: string
  dateOfBirth: string
  emergencyContact: string
}

// Walk-in booking data interface
interface WalkInBookingData {
  patient: WalkInPatientData | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
  appointmentType: string
  notes: string
  urgency: 'normal' | 'urgent' | 'emergency'
}

export const useScheduleWalkIn = () => {
  // Current step (1-3: Patient Info, Doctor & Time, Confirmation)
  const currentStep = ref(1)
  
  // Booking data
  const bookingData = ref<WalkInBookingData>({
    patient: null,
    doctor: null,
    date: null,
    timeSlot: null,
    appointmentType: 'Walk-in Consultation',
    notes: '',
    urgency: 'normal'
  })

  // Staff clinic info (would come from auth context in real app)
  const staffClinic = ref({
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
  })

  // Available doctors at staff's clinic
  const availableDoctors = ref<Doctor[]>([
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
      clinic_id: 1,
      active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Dr. David Chen',
      specialty: 'Emergency Medicine',
      clinic_id: 1,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])

  // Available time slots for today and next few days
  const generateTimeSlots = (doctorId?: number): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const baseSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ]
    
    baseSlots.forEach((time, index) => {
      // Simulate some slots being unavailable
      const available = Math.random() > 0.3
      const startTime = new Date()
      startTime.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30)
      
      slots.push({
        id: index + 1,
        doctor_id: doctorId || 1,
        clinic_id: 1,
        slot_start: startTime.toISOString(),
        slot_end: endTime.toISOString(),
        status: available ? 'available' : 'booked',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })
    
    return slots
  }

  const availableSlots = computed(() => {
    if (!bookingData.value.doctor || !bookingData.value.date) return []
    return generateTimeSlots(bookingData.value.doctor.id).filter(slot => slot.status === 'available')
  })

  const appointmentTypes = [
    'Walk-in Consultation',
    'Emergency Visit',
    'Follow-up',
    'Medication Review',
    'Health Screening',
    'Vaccination',
    'Minor Procedure'
  ]

  // Computed properties
  const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!(bookingData.value.patient?.name && bookingData.value.patient?.phone)
      case 2:
        return !!(bookingData.value.doctor && bookingData.value.date && bookingData.value.timeSlot)
      case 3:
        return true
      default:
        return false
    }
  })

  const isLastStep = computed(() => currentStep.value === 3)
  const isFirstStep = computed(() => currentStep.value === 1)

  // Actions
  const updatePatientInfo = (patientData: Partial<WalkInPatientData>) => {
    if (!bookingData.value.patient) {
      bookingData.value.patient = {
        name: '',
        phone: '',
        nric: '',
        email: '',
        dateOfBirth: '',
        emergencyContact: ''
      }
    }
    Object.assign(bookingData.value.patient, patientData)
  }

  const selectDoctor = (doctor: Doctor) => {
    bookingData.value.doctor = doctor
    // Reset time slot when doctor changes
    bookingData.value.timeSlot = null
  }

  const selectDate = (date: DateValue) => {
    bookingData.value.date = date
    // Reset time slot when date changes
    bookingData.value.timeSlot = null
  }

  const selectTimeSlot = (timeSlot: TimeSlot) => {
    bookingData.value.timeSlot = timeSlot
  }

  const setAppointmentType = (type: string) => {
    bookingData.value.appointmentType = type
  }

  const setUrgency = (urgency: 'normal' | 'urgent' | 'emergency') => {
    bookingData.value.urgency = urgency
  }

  const setNotes = (notes: string) => {
    bookingData.value.notes = notes
  }

  const nextStep = () => {
    if (canProceedToNextStep.value && !isLastStep.value) {
      currentStep.value++
    }
  }

  const previousStep = () => {
    if (!isFirstStep.value) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      currentStep.value = step
    }
  }

  const resetBooking = () => {
    currentStep.value = 1
    bookingData.value = {
      patient: null,
      doctor: null,
      date: null,
      timeSlot: null,
      appointmentType: 'Walk-in Consultation',
      notes: '',
      urgency: 'normal'
    }
  }

  const scheduleWalkIn = async () => {
    try {
      console.log('Scheduling walk-in appointment:', bookingData.value)
      
      // Simulate API call to schedule walk-in appointment
      const appointmentData = {
        ...bookingData.value,
        clinicId: staffClinic.value.id,
        clinicName: staffClinic.value.name,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        isWalkIn: true
      }
      
      // Here you would make an actual API call
      // await scheduleWalkInAppointment(appointmentData)
      
      return {
        success: true,
        appointmentId: `WI-${Date.now()}`,
        queueNumber: Math.floor(Math.random() * 50) + 1
      }
    } catch (error) {
      console.error('Walk-in scheduling failed:', error)
      return {
        success: false,
        error: 'Failed to schedule walk-in appointment'
      }
    }
  }

  // Utility functions
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return {
    // State
    currentStep,
    bookingData,
    staffClinic,
    availableDoctors,
    appointmentTypes,
    
    // Computed
    availableSlots,
    canProceedToNextStep,
    isLastStep,
    isFirstStep,
    
    // Actions
    updatePatientInfo,
    selectDoctor,
    selectDate,
    selectTimeSlot,
    setAppointmentType,
    setUrgency,
    setNotes,
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    scheduleWalkIn,
    
    // Utilities
    formatTime,
    getUrgencyColor
  }
}
