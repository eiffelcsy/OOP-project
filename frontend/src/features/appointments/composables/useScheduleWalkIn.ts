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

  // Generate time slots for a doctor on a selected date
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue): Promise<TimeSlot[]> => {
    if (!doctorId || !selectedDate) return []

    const selectedDateStr = new Date(selectedDate.toString()).toISOString().split('T')[0] // YYYY-MM-DD
    const dayOfWeek = new Date(selectedDate.toString()).getDay() === 0 ? 7 : new Date(selectedDate.toString()).getDay()

    // Fetch doctor schedules
    const res = await fetch(`http://localhost:8080/api/admin/doctors/${doctorId}/schedules`)
    if (!res.ok) throw new Error('Failed to fetch doctor schedules')
    const schedules = await res.json()

    const validSchedules = schedules.filter((sch: any) => {
      const validFrom = new Date(sch.validFrom)
      const validTo = new Date(sch.validTo)
      const selected = new Date(selectedDate.toString())
      return sch.dayOfWeek === dayOfWeek && selected >= validFrom && selected <= validTo
    })

    const slots: TimeSlot[] = []

    validSchedules.forEach((schedule: any) => {
      const slotDuration = schedule.slotDurationMinutes

      // Helper: convert "HH:mm" to SGT Date object
      const toSgtDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        const d = new Date(`${selectedDateStr}T00:00:00`) // midnight
        d.setHours(hours + 8, minutes) // add UTC+8 offset
        return d
      }

      let current = toSgtDate(schedule.startTime)
      const endTime = toSgtDate(schedule.endTime)
      let slotIndex = 1

      while (current < endTime) {
        const slotEnd = new Date(current)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        slots.push({
          id: slotIndex++,
          doctor_id: doctorId,
          clinic_id: staffClinic.value.id,
          slot_start: current.toISOString(), // store as ISO string with correct SGT offset
          slot_end: slotEnd.toISOString(),
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        current = slotEnd
      }
    })

    return slots
  }

  // Watch for doctor/date changes and update available slots
  const availableSlots = ref<TimeSlot[]>([])

  watch(
    [() => bookingData.value.doctor, () => bookingData.value.date],
    async ([doctor, date]) => {
      if (!doctor || !date) {
        availableSlots.value = []
        return
      }

      const generatedSlots = await generateTimeSlots(doctor.id, date)

      const selectedDateStr = new Date(date.toString()).toISOString().split('T')[0]
      const bookedAppointments = clinicAppointments.value.filter(
        (appt) =>
          appt.doctor_id === doctor.id &&
          appt.status === 'scheduled' &&
          appt.start_time.startsWith(selectedDateStr)
      )

      availableSlots.value = generatedSlots.map((slot) => {
        const slotStart = new Date(slot.slot_start)
        const slotEnd = new Date(slot.slot_end)

        const isBooked = bookedAppointments.some((appt) => {
          const apptStart = new Date(appt.start_time)
          const apptEnd = new Date(appt.end_time)
          return slotStart < apptEnd && slotEnd > apptStart
        })

        return {
          ...slot,
          status: isBooked ? 'scheduled' : 'available'
        }
      })
    },
    { immediate: true }
  )

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
  // Format time to SGT for display
  const formatTime = (time: Date | string | undefined) => {
    if (!time) return ''
    const date = typeof time === 'string' ? new Date(time) : time
    return date.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Singapore'
    })
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
