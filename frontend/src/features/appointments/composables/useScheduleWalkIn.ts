import { ref, computed, onMounted, watch } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'

const { currentUser, initializeAuth } = useAuth()

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
}

export const useScheduleWalkIn = () => {
  // Current step (1-3: Patient Info, Doctor & Time, Confirmation)
  const currentStep = ref(1)

  // Booking data
  const bookingData = ref<WalkInBookingData>({
    patient: null,
    doctor: null,
    date: null,
    timeSlot: null
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
  })

  // Available doctors at staff's clinic
  const availableDoctors = ref<Doctor[]>([])
  const clinicAppointments = ref<Tables<'appointments'>[]>([])

  // Fetch doctors for the current staff's clinic
  const fetchDoctors = async (clinicId: number) => {
    try {
      console.log('Fetching doctors for clinic ID:', clinicId)
      const res = await fetch(`http://localhost:8080/api/admin/doctors/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')

      const data: Tables<'doctors'>[] = await res.json()
      availableDoctors.value = data.map((doc, index) => ({
        ...doc,
        color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][index % 5],
      }))
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  // get appointments for the clinic
  const fetchClinicAppointments = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/appointments/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch clinic appointments')
      const data = await res.json()
      clinicAppointments.value = data
    } catch (error) {
      console.error('Error fetching clinic appointments:', error)
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

          if (user?.staff?.clinic_id) {
            const clinicId = user.staff.clinic_id
            fetchDoctors(clinicId)
            fetchClinicAppointments(clinicId)
          }
        } else {
          console.warn('Waiting for staff info to be available...')
        }
      },
      { immediate: true } // run instantly if already loaded
    )
  })

  // Available time slots for today and next few days
  const generateTimeSlots = (doctorId?: number): TimeSlot[] => {
    const baseSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ]

    // calculate the end time of a 30 min slot from its start time
    const add30Minutes = (time: string): string => {
      const [hour, minute] = time.split(':').map(Number)
      const totalMinutes = hour * 60 + minute + 30
      const newHour = Math.floor(totalMinutes / 60)
      const newMinute = totalMinutes % 60
      return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
    }

    // creating a structured list of slot for a doctor's schedule
    return baseSlots.map((time, index) => ({
      id: index + 1, // unique id for each slot 
      doctor_id: doctorId,
      clinic_id: staffClinic.value.id,
      slot_start: time, // how to make sure this is the time selected by user?
      slot_end: add30Minutes(time),
      status: Math.random() > 0.3 ? 'available' : 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  }

  // different schedule per day
  const availableSlots = computed(() => {
    const doctor = bookingData.value.doctor
    const date = bookingData.value.date
    if (!doctor || !date) return []

    const baseSlots = generateTimeSlots(doctor.id)

    const selectedDate = new Date(date.toString())
    const selectedDateStr = selectedDate.toISOString().split('T')[0] // "YYYY-MM-DD"

    // Filter appointments for this doctor & selected date
    const bookedAppointments = clinicAppointments.value.filter(
      (appt) =>
        appt.doctor_id === doctor.id &&
        appt.status === 'scheduled' &&
        appt.start_time.startsWith(selectedDateStr)
    )

    // Mark slots as booked if they overlap with any scheduled appointment
    return baseSlots.map((slot) => {
      const slotStart = slot.slot_start
      const slotEnd = slot.slot_end

      const isBooked = bookedAppointments.some((appt) => {
        const apptStart = new Date(appt.start_time)
        const apptEnd = new Date(appt.end_time)

        // Convert UTC → local time string "HH:mm"
        const apptStartStr = apptStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
        const apptEndStr = apptEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

        return slotStart >= apptStartStr && slotStart < apptEndStr
      })

      return {
        ...slot,
        status: isBooked ? 'scheduled' : 'available'
      }
    })
  })

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


  return {
    // State
    currentStep,
    bookingData,
    staffClinic,
    availableDoctors,

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
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    scheduleWalkIn,

    // Utilities
    formatTime
  }
}
