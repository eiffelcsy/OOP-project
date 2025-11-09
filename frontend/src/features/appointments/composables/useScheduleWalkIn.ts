import { ref, computed, onMounted, watch } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'
import { useAuth } from '@/features/auth/composables/useAuth'
import { clinicsApi } from '@/services/clinicsApi'
import { doctorsApi } from '@/services/doctorsApi'
import { appointmentsApi, type AppointmentResponse } from '@/services/appointmentsApi'
import { patientsApi } from '@/services/patientsApi'
import { schedulesApi } from '@/services/schedulesApi'

const { currentUser, initializeAuth } = useAuth()

type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Ensures that whenever you create or update a patient, TypeScript will check that all these fields exist and have the correct type
interface WalkInPatientData {
  phone: string
  nric: string
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
    source_ref: null as string | null,
    remarks: null as string | null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    open_time: null as string | null,
    close_time: null as string | null,
  })

  const availableDoctors = ref<Doctor[]>([])
  const clinicAppointments = ref<AppointmentResponse[]>([])
  const availableSlots = ref<TimeSlot[]>([])
  const fetchedSchedules = ref<any[]>([])
  const fetchedSchedulesRaw = ref<any[]>([])

  const fetchClinic = async (clinicId: number) => {
    try {
      const data = await clinicsApi.getClinicById(clinicId)

      // Update staffClinic fields while keeping the object structure
      staffClinic.value.id = data.id
      staffClinic.value.name = data.name
      staffClinic.value.clinic_type = data.clinic_type || 'General'
      staffClinic.value.region = data.region || ''
      staffClinic.value.area = data.area || ''
      staffClinic.value.address_line = data.address_line || ''
      staffClinic.value.source_ref = null // source_ref not in API response
      staffClinic.value.remarks = data.remarks || null
      staffClinic.value.created_at = data.created_at || new Date().toISOString()
      staffClinic.value.updated_at = data.updated_at || new Date().toISOString()
      staffClinic.value.open_time = data.open_time || null
      staffClinic.value.close_time = data.close_time || null
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDoctors = async (clinicId: number) => {
    try {
      const data = await doctorsApi.getDoctorsByClinicId(clinicId)
      availableDoctors.value = data.map((doc, idx) => ({
        ...doc,
        color: ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][idx % 5]
      })) as any
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClinicAppointments = async (clinicId: number) => {
    try {
      clinicAppointments.value = await appointmentsApi.getClinicAppointments(clinicId) as any
    } catch (err) {
      console.error(err)
    }
  }

  // Helper: convert various timestamp formats to SGT date string 'YYYY-MM-DD'
  const toSgtDate = (raw: any): string | null => {
    if (raw == null) return null
    try {
      const d = new Date(String(raw))
      if (isNaN(d.getTime())) return null
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    } catch (_) {
      return null
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

  // Fetch and store schedules for a doctor (used for calendar availability)
  const fetchSchedulesForDoctor = async (doctorId: number) => {
    try {
      const schedules = await schedulesApi.getSchedulesByDoctorId(doctorId)

      // Store raw schedules
      fetchedSchedulesRaw.value = schedules

      // Determine target date in SGT for validity checks
      const targetDateStr = bookingData.value.date
        ? String(bookingData.value.date)
        : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

      // Filter schedules that are valid for the target date
      const activeSchedules = schedules.filter((sch: any) => {
        const vFrom = toSgtDate(sch.valid_from)
        const vTo = toSgtDate(sch.valid_to)

        if (vFrom && targetDateStr < vFrom) return false
        if (vTo && targetDateStr > vTo) return false

        return true
      })

      fetchedSchedules.value = activeSchedules
      return schedules
    } catch (err) {
      console.error('Error fetching schedules:', err)
      return []
    }
  }

  // --- Slot generation ---
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue) => {
    if (!doctorId || !selectedDate) return []

    // Get date string in YYYY-MM-DD format (SGT local date)
    const selectedDateStr = selectedDate.toString()
    const jsDate = new Date(selectedDateStr)
    const dayOfWeek = jsDate.getDay() === 0 ? 7 : jsDate.getDay()

    // Use cached schedules if available, otherwise fetch
    const schedules = fetchedSchedulesRaw.value.length > 0
      ? fetchedSchedulesRaw.value
      : await fetchSchedulesForDoctor(doctorId)

    const validSchedules = schedules.filter((sch: any) => {
      if (sch.day_of_week !== dayOfWeek) return false

      const vFrom = toSgtDate(sch.valid_from)
      const vTo = toSgtDate(sch.valid_to)

      // If vFrom exists and selectedDateStr is before it, exclude
      if (vFrom && selectedDateStr < vFrom) return false
      // If vTo exists and selectedDateStr is after it, exclude
      if (vTo && selectedDateStr > vTo) return false

      return true
    })

    const slots: TimeSlot[] = []
    let slotIndex = 1

    validSchedules.forEach((schedule: any) => {
      const slotDuration = schedule.slot_duration_minutes

      // Backend returns LocalTime as "HH:MM:SS" in Singapore timezone
      // Simply combine with the selected date to create SGT timestamps
      const startTime = schedule.start_time.substring(0, 5) // HH:MM
      const endTime = schedule.end_time.substring(0, 5) // HH:MM

      // Parse time strings to minutes for iteration
      const parseToMinutes = (t: string) => {
        const [hh, mm] = t.split(':').map(Number)
        return hh * 60 + mm
      }

      const startMin = parseToMinutes(startTime)
      let endMin = parseToMinutes(endTime)

      // Handle overnight schedules
      if (endMin <= startMin) endMin += 24 * 60

      const toHHMM = (mins: number) => {
        const m = mins % (24 * 60)
        const h = Math.floor(m / 60).toString().padStart(2, '0')
        const mm = (m % 60).toString().padStart(2, '0')
        return `${h}:${mm}`
      }

      // Generate slots
      for (let m = startMin; m + slotDuration <= endMin; m += slotDuration) {
        const slotStartTime = toHHMM(m)
        const slotEndTime = toHHMM(m + slotDuration)

        // Create Singapore local datetime strings (no timezone conversion needed)
        const slotStartIso = `${selectedDateStr}T${slotStartTime}:00+08:00`
        const slotEndIso = `${selectedDateStr}T${slotEndTime}:00+08:00`

        slots.push({
          id: slotIndex++,
          doctor_id: doctorId,
          clinic_id: staffClinic.value.id,
          slot_start: slotStartIso,
          slot_end: slotEndIso,
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    })

    return slots
  }


  // Computed: available dates with at least one free slot
  const availableDates = computed(() => {
    const out = new Set<string>()
    const doctorId = bookingData.value.doctor?.id
    if (!doctorId || fetchedSchedulesRaw.value.length === 0) return out

    const daysAhead = 60
    const nowMs = Date.now()
    const todaySgt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    const today = new Date()

    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const jsDay = d.getDay()
      const dayNum = jsDay === 0 ? 7 : jsDay

      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

      // Find schedule rows for this weekday
      const rows = fetchedSchedulesRaw.value.filter((r: any) => Number(r.day_of_week) === Number(dayNum))
      if (!rows || rows.length === 0) continue

      let dateHasFree = false
      for (const row of rows) {
        // Check validity for this specific date
        const vFrom = toSgtDate(row.valid_from)
        const vTo = toSgtDate(row.valid_to)
        if (vFrom && dateStr < vFrom) continue
        if (vTo && dateStr > vTo) continue

        // Generate slots for this row
        const startTime = row.start_time.substring(0, 5)
        const endTime = row.end_time.substring(0, 5)
        const slotDuration = row.slot_duration_minutes

        const parseToMinutes = (t: string) => {
          const [hh, mm] = t.split(':').map(Number)
          return hh * 60 + mm
        }

        const startMin = parseToMinutes(startTime)
        let endMin = parseToMinutes(endTime)
        if (endMin <= startMin) endMin += 24 * 60

        const toHHMM = (mins: number) => {
          const m = mins % (24 * 60)
          const h = Math.floor(m / 60).toString().padStart(2, '0')
          const mm = (m % 60).toString().padStart(2, '0')
          return `${h}:${mm}`
        }

        // Check if any slot is free
        for (let m = startMin; m + slotDuration <= endMin; m += slotDuration) {
          const slotStartTime = toHHMM(m)
          const slotStartIso = `${dateStr}T${slotStartTime}:00+08:00`

          // If today, check if slot is in the future
          if (dateStr === todaySgt) {
            const slotStartMs = new Date(slotStartIso).getTime()
            if (slotStartMs <= nowMs) continue
          }

          // Check if slot is booked
          const slotEndTime = toHHMM(m + slotDuration)
          const slotEndIso = `${dateStr}T${slotEndTime}:00+08:00`

          const blockingStatuses = ['checked_in', 'completed', 'scheduled', 'confirmed']
          const isBooked = clinicAppointments.value.some(appt => {
            if (appt.doctor_id !== doctorId) return false
            const status = appt.status || ''
            if (!blockingStatuses.includes(status)) return false

            const apptStart = new Date(appt.start_time).getTime()
            const apptEnd = new Date(appt.end_time).getTime()
            const sMs = new Date(slotStartIso).getTime()
            const eMs = new Date(slotEndIso).getTime()

            return apptStart < eMs && apptEnd > sMs
          })

          if (!isBooked) {
            dateHasFree = true
            break
          }
        }

        if (dateHasFree) break
      }

      if (dateHasFree) out.add(dateStr)
    }

    return out
  })

  watch(
    [() => bookingData.value.doctor, () => bookingData.value.date],
    async ([doctor, date]) => {
      if (!doctor) {
        availableSlots.value = []
        fetchedSchedules.value = []
        fetchedSchedulesRaw.value = []
        return
      }

      // Fetch schedules when doctor changes
      if (doctor && fetchedSchedulesRaw.value.length === 0) {
        await fetchSchedulesForDoctor(doctor.id)
      }

      if (!date) {
        availableSlots.value = []
        return
      }

      const generatedSlots = await generateTimeSlots(doctor.id, date as DateValue)
      const selectedDateStr = date.toString()

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
      case 1: return !!(bookingData.value.patient?.nric && bookingData.value.patient?.phone)
      case 2: return !!(bookingData.value.doctor && bookingData.value.date && bookingData.value.timeSlot)
      case 3: return true
      default: return false
    }
  })

  const isLastStep = computed(() => currentStep.value === 3)
  const isFirstStep = computed(() => currentStep.value === 1)

  // Updates the patient info in bookingData.
  const updatePatientInfo = (patientData: Partial<WalkInPatientData>) => {
    if (!bookingData.value.patient) bookingData.value.patient = { phone: '', nric: '' }
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
      console.log('scheduleWalkIn called')

      if (!bookingData.value.patient || !bookingData.value.doctor || !bookingData.value.date || !bookingData.value.timeSlot) {
        console.log('Incomplete booking data')
        return {
          success: false,
          error: 'Incomplete booking data'
        }
      }

      // Check if patient exists with BOTH NRIC AND phone number in the SAME row
      const patients = await patientsApi.getAllPatients()
      console.log('Patients in database:', patients.length)

      // Find patient where BOTH NRIC AND phone match in the same record
      const existingPatient = patients.find((p: any) => {
        const patientNric = bookingData.value.patient?.nric?.trim().toUpperCase()
        const patientPhone = bookingData.value.patient?.phone?.trim()

        const dbNric = p.nric?.trim().toUpperCase()
        const dbPhone = p.phone?.trim()

        console.log('Checking patient:', {
          dbNric: dbNric,
          dbPhone: dbPhone,
          inputNric: patientNric,
          inputPhone: patientPhone,
          nricMatches: patientNric && dbNric && patientNric === dbNric,
          phoneMatches: patientPhone && dbPhone && patientPhone === dbPhone,
          bothMatch: patientNric && dbNric && patientNric === dbNric &&
            patientPhone && dbPhone && patientPhone === dbPhone
        })

        // BOTH NRIC AND phone number match in THIS SAME row
        return patientNric && dbNric && patientNric === dbNric &&
          patientPhone && dbPhone && patientPhone === dbPhone
      })

      if (!existingPatient) {
        console.log('Patient not found with matching NRIC AND phone in the same record')
        return {
          success: false,
          error: 'Patient not found. Please ensure both NRIC and phone number match the same patient record.'
        }
      }

      const patientId = existingPatient.id
      console.log('Using existing patient:', {
        id: existingPatient.id,
        nric: existingPatient.nric,
        phone: existingPatient.phone,
        name: existingPatient.full_name
      })

      // Use the timestamps directly from the slot
      const startTime = bookingData.value.timeSlot.slot_start
      const endTime = bookingData.value.timeSlot.slot_end

      // Build appointment payload
      const appointmentPayload = {
        patient_id: patientId,
        doctor_id: bookingData.value.doctor.id,
        clinic_id: staffClinic.value.id,
        time_slot_id: null,
        start_time: startTime,
        end_time: endTime,
        treatment_summary: null
      }
      console.log('Appointment payload:', appointmentPayload)

      // Add Idempotency-Key to prevent duplicate bookings
      const idempotencyKeyRef = (bookingData as any)._idempotencyKey ||= ref<string | null>(null)
      if (!idempotencyKeyRef.value) {
        idempotencyKeyRef.value = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      }

      // POST to backend using appointmentsApi
      console.log('Creating appointment...')
      // email sending happens inside createAppointment
      const appointment = await appointmentsApi.createAppointment(appointmentPayload, idempotencyKeyRef.value)
      console.log('Appointment creation response:', appointment)

      if (!appointment) {
        return {
          success: false,
          error: 'No response from appointment creation'
        }
      }

      if (!appointment.id) {
        return {
          success: false,
          error: 'Appointment created but no ID returned'
        }
      }

      console.log('Appointment created successfully, ID:', appointment.id)

      return {
        success: true,
        appointmentId: appointment.id,
        queueNumber: Math.floor(Math.random() * 50) + 1,
        message: 'Appointment scheduled successfully!'
      }
    } catch (err: any) {
      console.error('Error scheduling walk-in:', err)
      return {
        success: false,
        error: err.message || 'Failed to schedule walk-in appointment'
      }
    }
  }

  return {
    currentStep, bookingData, staffClinic, availableDoctors,
    availableSlots, availableDates, canProceedToNextStep, isLastStep, isFirstStep,
    updatePatientInfo, selectDoctor, selectDate, selectTimeSlot,
    nextStep, previousStep, goToStep, resetBooking, scheduleWalkIn,
    formatTime
  }
}