import { ref, computed, onMounted, watch } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'

const { currentUser, initializeAuth } = useAuth()

type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Ensures that whenever you create or update a patient, TypeScript will check that all these fields exist and have the correct type
interface WalkInPatientData {
  name: string
  phone: string
  nric: string
  email: string
  dateOfBirth: string
}

// Groups together all the information you need to make a booking: patient info, selected doctor, date, and time slot.
interface WalkInBookingData {
  patient: WalkInPatientData | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
}

export const useScheduleWalkIn = () => {
  const currentStep = ref(1)
  const bookingData = ref<WalkInBookingData>({
    patient: null,
    doctor: null,
    date: null,
    timeSlot: null
  })

  // Always keep this structure | default values to avoid undefined errors
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

  const availableDoctors = ref<Doctor[]>([])
  const clinicAppointments = ref<Tables<'appointments'>[]>([])
  const availableSlots = ref<TimeSlot[]>([])

  const fetchClinic = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/clinics/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch clinic')
      const data = await res.json()

      // Update staffClinic fields while keeping the object structure
      staffClinic.value.id = data.id
      staffClinic.value.name = data.name
      staffClinic.value.clinic_type = data.clinic_type
      staffClinic.value.region = data.region
      staffClinic.value.area = data.area
      staffClinic.value.address_line = data.address_line
      staffClinic.value.source_ref = data.source_ref
      staffClinic.value.remarks = data.remarks
      staffClinic.value.created_at = data.created_at || new Date().toISOString()
      staffClinic.value.updated_at = data.updated_at || new Date().toISOString()
      staffClinic.value.open_time = data.open_time
      staffClinic.value.close_time = data.close_time
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDoctors = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/doctors/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')
      const data: Doctor[] = await res.json()
      availableDoctors.value = data.map((doc, idx) => ({
        ...doc,
        color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][idx % 5]
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClinicAppointments = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/appointments/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch appointments')
      clinicAppointments.value = await res.json()
    } catch (err) {
      console.error(err)
    }
  }

  onMounted(async () => {
    await initializeAuth()

    watch(
      () => currentUser.value,
      (user) => {
        if (user?.staff?.clinic_id) {
          const clinicId = user.staff.clinic_id
          fetchClinic(clinicId)
          fetchDoctors(clinicId)
          fetchClinicAppointments(clinicId)
        }
      },
      { immediate: true }
    )
  })

  // --- Slot generation ---
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue) => {
    if (!doctorId || !selectedDate) return []

    const selectedDateStr = new Date(selectedDate.toString()).toISOString().split('T')[0]
    const dayOfWeek = new Date(selectedDate.toString()).getDay() === 0 ? 7 : new Date(selectedDate.toString()).getDay()

    const res = await fetch(`http://localhost:8080/api/admin/doctors/${doctorId}/schedules`)
    if (!res.ok) throw new Error('Failed to fetch schedules')
    const schedules = await res.json()

    const validSchedules = schedules.filter((sch: any) => {
      const validFrom = new Date(sch.valid_from)
      const validTo = new Date(sch.valid_to)
      const selected = new Date(selectedDate.toString())
      return sch.day_of_week === dayOfWeek && selected >= validFrom && selected <= validTo
    })

    const slots: TimeSlot[] = []
    let slotIndex = 1

    validSchedules.forEach((schedule: any) => {
      const slotDuration = schedule.slot_duration_minutes

      const toUtcDate = (timeStr: string) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number)
        const d = new Date(`${selectedDateStr}T00:00:00Z`)
        d.setUTCHours(hours, minutes, seconds || 0)
        return d
      }

      let current = toUtcDate(schedule.start_time)
      const endTime = toUtcDate(schedule.end_time)

      while (current < endTime) {
        const slotEnd = new Date(current)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        slots.push({
          id: slotIndex++,
          doctor_id: doctorId,
          clinic_id: staffClinic.value.id,
          slot_start: current.toISOString(),
          slot_end: slotEnd.toISOString(),
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        current = slotEnd
      }
    })

    return slots
  }


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
          (appt.status === 'scheduled' || appt.status === 'confirmed') &&
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

  // --- Booking actions ---
  // Determines whether the user can go to the next step in the booking process
  const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
      case 1: return !!(bookingData.value.patient?.name && bookingData.value.patient?.phone)
      case 2: return !!(bookingData.value.doctor && bookingData.value.date && bookingData.value.timeSlot)
      case 3: return true
      default: return false
    }
  })

  const isLastStep = computed(() => currentStep.value === 3)
  const isFirstStep = computed(() => currentStep.value === 1)

  // Updates the patient info in bookingData.
  const updatePatientInfo = (patientData: Partial<WalkInPatientData>) => {
    if (!bookingData.value.patient) bookingData.value.patient = { name: '', phone: '', nric: '', email: '', dateOfBirth: '' }
    Object.assign(bookingData.value.patient, patientData)
  }

  const selectDoctor = (doctor: Doctor) => { bookingData.value.doctor = doctor; bookingData.value.timeSlot = null }
  const selectDate = (date: DateValue) => { bookingData.value.date = date; bookingData.value.timeSlot = null }
  const selectTimeSlot = (timeSlot: TimeSlot) => { bookingData.value.timeSlot = timeSlot }
  const nextStep = () => { if (canProceedToNextStep.value && !isLastStep.value) currentStep.value++ }
  const previousStep = () => { if (!isFirstStep.value) currentStep.value-- }
  const goToStep = (step: number) => { if (step >= 1 && step <= 3) currentStep.value = step }
  const resetBooking = () => { currentStep.value = 1; bookingData.value = { patient: null, doctor: null, date: null, timeSlot: null } }

  // --- ADD (POST) scheduleWalkIn function ---
  const scheduleWalkIn = async () => {
    try {
      if (!bookingData.value.patient || !bookingData.value.doctor || !bookingData.value.date || !bookingData.value.timeSlot) {
        throw new Error('Incomplete booking data')
      }

      // Fetch patient ID by NRIC
      const patientRes = await fetch('http://localhost:8080/api/patient/all')
      if (!patientRes.ok) throw new Error('Failed to fetch patients')
      const patients = await patientRes.json()
      const patient = patients.find(
        (p: any) => p.nric.trim().toUpperCase() === bookingData.value.patient?.nric.trim().toUpperCase()
      )
      if (!patient) throw new Error('Patient not found')
      const patientId = patient.id

      // Prepare start and end time in UTC
      const startTime = new Date(bookingData.value.timeSlot.slot_start).toISOString()
      const slotDurationMinutes = (new Date(bookingData.value.timeSlot.slot_end).getTime() - new Date(bookingData.value.timeSlot.slot_start).getTime()) / 60000
      const endTime = new Date(new Date(startTime).getTime() + slotDurationMinutes * 60 * 1000).toISOString()
      const nowUtc = new Date().toISOString()

      // Build appointment payload
      const appointmentPayload = {
        // required by backend
        patient_id: patientId,
        doctor_id: bookingData.value.doctor.id,
        clinic_id: staffClinic.value.id,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
        treatment_summary: null,
        created_at: nowUtc,
        updated_at: nowUtc
      }

      // Add Idempotency-Key to prevent duplicate bookings
      const idempotencyKeyRef = (bookingData as any)._idempotencyKey ||= ref<string | null>(null)
      if (!idempotencyKeyRef.value) {
        idempotencyKeyRef.value = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      }

      // Attach Authorization header if available (staff/admin token)
      const { getAccessToken } = useAuth()
      let token: string | null = null
      try {
        token = await getAccessToken?.()
      } catch { token = null }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKeyRef.value,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }

      // POST to backend
      const res = await fetch('http://localhost:8080/api/appointments', {
        method: 'POST',
        headers,
        body: JSON.stringify(appointmentPayload)
      })

      if (!res.ok) {
        let errText = await res.text().catch(() => '')
        throw new Error(errText || 'Failed to schedule appointment')
      }

      const appointment = await res.json()

      return {
        success: true,
        appointmentId: appointment.id,
        queueNumber: Math.floor(Math.random() * 50) + 1
      }
    } catch (err: any) {
      console.error(err)
      return { success: false, error: err.message || 'Failed to schedule walk-in appointment' }
    }
  }


  return {
    currentStep, bookingData, staffClinic, availableDoctors,
    availableSlots, canProceedToNextStep, isLastStep, isFirstStep,
    updatePatientInfo, selectDoctor, selectDate, selectTimeSlot,
    nextStep, previousStep, goToStep, resetBooking, scheduleWalkIn,
    formatTime
  }
}