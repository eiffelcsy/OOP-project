import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import type { Tables } from '@/types/supabase'
import type { DateValue } from '@internationalized/date'
import { apiClient } from '@/lib/api'
import { doctorsApi } from '@/services/doctorsApi'
import { appointmentsApi } from '@/services/appointmentsApi'

// Define proper TypeScript interfaces
interface Appointment {
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
  status: string
}

interface Doctor {
  id: number
  name: string
  specialty: string
  // add other fields as needed
}

interface Clinic {
  id: number
  name: string
  clinic_type: string
  // add other fields as needed
}

export function useAllAppointments() {
  const { currentUser, initializeAuth } = useAuth()

  const allAppointments = ref<Appointment[]>([])
  const doctors = ref<Doctor[]>([])
  const clinics = ref<Clinic[]>([])
  const availableSlots = ref<Tables<'time_slots'>[]>([])
  const rescheduleAvailableSlots = ref<Tables<'time_slots'>[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const bookingData = ref<{ doctor: Doctor | null; date: DateValue | null }>({
    doctor: null,
    date: null
  })

  // Utility function to check if appointment can be modified (24 hours in advance)
  const canModifyAppointment = (appointmentDate: string, appointmentTime: string): boolean => {
    try {
      // Create appointment datetime in SGT
      const appointmentDateTimeSGT = new Date(`${appointmentDate}T${appointmentTime}:00+08:00`)

      // Get current datetime in SGT
      const nowSGT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))

      // Calculate difference in hours
      const timeDifferenceMs = appointmentDateTimeSGT.getTime() - nowSGT.getTime()
      const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60)

      // Allow modification if more than 24 hours in advance
      return timeDifferenceHours >= 24
    } catch (err) {
      console.error('Error checking appointment modification eligibility:', err)
      return false
    }
  }

  // Utility function to get time remaining until appointment
  const getTimeRemaining = (appointmentDate: string, appointmentTime: string): string => {
    try {
      // Create appointment datetime in SGT
      const appointmentDateTimeSGT = new Date(`${appointmentDate}T${appointmentTime}:00+08:00`)

      // Get current datetime in SGT
      const nowSGT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))

      // Calculate difference in milliseconds
      const timeDifferenceMs = appointmentDateTimeSGT.getTime() - nowSGT.getTime()

      if (timeDifferenceMs <= 0) {
        return 'Appointment time has passed'
      }

      // Convert to days, hours, minutes
      const days = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDifferenceMs % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else {
        return `${minutes}m`
      }
    } catch (err) {
      console.error('Error calculating time remaining:', err)
      return 'Error calculating time'
    }
  }

  // --- Fetch doctors ---
  const fetchDoctors = async (clinicId: number) => {
    try {
      doctors.value = await doctorsApi.getDoctorsByClinicId(clinicId)

      // Set default doctor if none is selected
      if (!bookingData.value.doctor && doctors.value.length > 0) {
        bookingData.value = {
          doctor: doctors.value[0],
          date: bookingData.value.date
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
      error.value = 'Failed to fetch doctors'
    }
  }

  // --- Fetch all appointments ---
  const fetchAllAppointments = async () => {
    try {
      loading.value = true
      error.value = null

      if (!currentUser.value?.staff?.clinic_id) {
        throw new Error('No clinic ID found for current user')
      }

      const clinicId = currentUser.value.staff.clinic_id

      await fetchDoctors(clinicId)

      const data = await appointmentsApi.getClinicAppointments(clinicId)

      // Filter out past appointments (SGT timezone)
      const nowSGT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
      const upcomingAppointments = data.filter((appt: any) => {
        if (!appt.start_time) return false
        const apptSGT = new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
        return apptSGT >= nowSGT
      })

      // Fetch related data in parallel
      const [patients, profiles, clinicsData] = await Promise.all([
        apiClient.get('/api/patient/all'),
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/admin/clinics')
      ])

      clinics.value = clinicsData

      // Transform appointments with enriched data
      allAppointments.value = upcomingAppointments.map((appt: any) => {
        const start = appt.start_time
          ? new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
          : null

        const timeStr = start
          ? `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
          : '-'

        let patientName = '-'
        let patientPhone = '-'

        const patient = patients.find((p: any) => String(p.id) === String(appt.patient_id))
        if (patient) {
          patientPhone = patient.phone ?? '-'
          if (patient.user_id) {
            const profile = profiles.find((u: any) => String(u.user_id) === String(patient.user_id))
            if (profile) patientName = profile.full_name ?? '-'
          }
        }

        const doctor = doctors.value.find((d: Doctor) => d.id === appt.doctor_id)
        const doctorName = doctor?.name ?? '-'
        const doctorSpecialty = doctor?.specialty ?? '-'

        const clinic = clinics.value.find((c: Clinic) => c.id === appt.clinic_id)
        const clinicName = clinic?.name ?? '-'
        const clinicType = clinic?.clinic_type ?? '-'

        const dateStr = start ? start.toISOString().split('T')[0] : '-'

        return {
          id: appt.id,
          patientName,
          patientId: appt.patient_id,
          patientPhone,
          doctorId: appt.doctor_id,
          doctorName,
          doctorSpecialty,
          clinicId: appt.clinic_id,
          clinicName,
          clinicType,
          type: appt.treatment_summary ?? 'Consultation',
          date: dateStr,
          time: timeStr,
          status: appt.status
        } as Appointment
      })
    } catch (err) {
      console.error('Error fetching appointments:', err)
      error.value = 'Failed to fetch appointments'
    } finally {
      loading.value = false
    }
  }

  // --- Cancel appointment ---
  const cancelAppointment = async (appointmentId: number) => {
    try {
      error.value = null

      const appointmentIndex = allAppointments.value.findIndex(apt => apt.id === appointmentId)
      if (appointmentIndex === -1) {
        throw new Error('Appointment not found')
      }

      const appointment = allAppointments.value[appointmentIndex]

      // Check if appointment can be cancelled (24 hours in advance)
      if (!canModifyAppointment(appointment.date, appointment.time)) {
        error.value = 'Appointments can only be cancelled at least 24 hours in advance'
        return false
      }

      // This might return null (empty response), but that's OK for DELETE
      await appointmentsApi.cancelAppointment(appointmentId)

      // Update local state for real-time UI
      allAppointments.value[appointmentIndex] = {
        ...appointment,
        status: 'cancelled'
      }

      console.log('Appointment cancelled successfully')
      return true
    } catch (err) {
      console.error('Cancel appointment failed:', err)
      error.value = 'Failed to cancel appointment: ' + (err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }


  // --- Generate timeslots ---
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue | string) => {
    if (!doctorId || !selectedDate) return []

    try {
      // Get date string in YYYY-MM-DD format (SGT local date)
      const selectedDateStr = typeof selectedDate === 'string'
        ? selectedDate
        : selectedDate.toString()

      const jsDate = new Date(selectedDateStr)
      const dayOfWeek = jsDate.getDay() === 0 ? 7 : jsDate.getDay()

      const schedules = await apiClient.get(`/api/admin/doctors/${doctorId}/schedules`)

      // Helper: convert validity dates to SGT date strings for comparison
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

      const slots: Tables<'time_slots'>[] = []
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
            clinic_id: currentUser.value?.staff?.clinic_id ?? 0,
            slot_start: slotStartIso,
            slot_end: slotEndIso,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      })

      return slots
    } catch (err) {
      console.error('Error generating time slots:', err)
      return []
    }
  }

  // --- Reschedule appointment ---
  const rescheduleAppointment = async (
    appointmentId: number,
    newDate: DateValue | string,
    newTime: string // This should be the full ISO timestamp like "2024-11-08T09:00:00+08:00"
  ) => {
    try {
      error.value = null

      const appointment = allAppointments.value.find((apt: Appointment) => apt.id === appointmentId)
      if (!appointment) {
        throw new Error("Appointment not found locally")
      }

      console.log("[RESCHEDULE] Starting reschedule for appointment:", appointmentId)
      console.log("[RESCHEDULE] Selected date:", newDate)
      console.log("[RESCHEDULE] Selected time (raw):", newTime)

      // newTime is now a full ISO timestamp like "2024-11-08T09:00:00+08:00"
      // We need to use it directly as the start time
      const newStartTime = newTime

      // Parse the ISO timestamp to calculate end time
      const startDate = new Date(newStartTime)

      if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid start time: ${newTime}`)
      }

      // Get the correct slot duration based on the day of week
      const selectedDateStr = typeof newDate === 'string' ? newDate : newDate.toString()
      const jsDate = new Date(selectedDateStr)
      const dayOfWeek = jsDate.getDay() === 0 ? 7 : jsDate.getDay()

      const schedules = await apiClient.get(`/api/admin/doctors/${appointment.doctorId}/schedules`)

      // Find the schedule for the specific day of week
      const scheduleForDay = schedules.find((sch: any) => sch.day_of_week === dayOfWeek)

      const slotDuration = scheduleForDay?.slot_duration_minutes

      const endDate = new Date(startDate.getTime() + slotDuration * 60 * 1000)
      const newEndTime = endDate.toISOString()

      console.log("[RESCHEDULE] Final times:")
      console.log("  - Start:", newStartTime)
      console.log("  - End:", newEndTime)
      console.log("  - Slot Duration:", slotDuration, "minutes")
      console.log("  - Day of Week:", dayOfWeek)

      await appointmentsApi.updateAppointment(appointmentId, newStartTime, newEndTime)

      // Refresh appointments to get updated data
      await fetchAllAppointments()

      console.log("[RESCHEDULE] Success!")
      return true
    } catch (err) {
      console.error("Reschedule appointment failed:", err)
      error.value = 'Failed to reschedule appointment: ' + (err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  // --- Watch bookingData for reactive timeslot generation ---
  watch(
    bookingData,
    async ({ doctor, date }) => {
      if (!doctor || !date) {
        rescheduleAvailableSlots.value = []
        return
      }

      try {
        const dateStr = typeof date === 'string' ? date : date.toString()
        const generatedSlots = await generateTimeSlots(doctor.id, dateStr)
        const selectedDateStr = dateStr // Already in YYYY-MM-DD format

        const bookedAppointments = allAppointments.value.filter(
          (appt) =>
            appt.doctorId === doctor.id &&
            (appt.status === 'scheduled' || appt.status === 'confirmed') &&
            appt.date === selectedDateStr
        )

        // Fetch schedules for this doctor to get slot durations
        const schedules = await apiClient.get(`/api/admin/doctors/${doctor.id}/schedules`)

        rescheduleAvailableSlots.value = generatedSlots.map((slot) => {
          // slot.slot_start and slot.slot_end are now full ISO timestamps like "2024-11-08T09:00:00+08:00"
          const slotStart = new Date(slot.slot_start)
          const slotEnd = new Date(slot.slot_end)


          const isBooked = bookedAppointments.some((appt) => {
            // appt.time is in HH:MM format, combine with date to create SGT timestamp
            // Use the actual appointment start_time and end_time from the database
            const apptStart = new Date(`${appt.date}T${appt.time}:00+08:00`)

            // Get the day of week for this appointment
            const appointmentDate = new Date(appt.date)
            const dayOfWeek = appointmentDate.getDay() === 0 ? 7 : appointmentDate.getDay()
            // Find the schedule for this day of week
            const scheduleForDay = schedules.find((sch: any) => sch.day_of_week === dayOfWeek)
            // Use the actual slot duration
            const slotDuration = scheduleForDay?.slot_duration_minutes

            const apptEnd = new Date(apptStart)
            apptEnd.setMinutes(apptEnd.getMinutes() + slotDuration)

            // Check for time overlap
            return slotStart < apptEnd && slotEnd > apptStart
          })

          return {
            ...slot,
            status: isBooked ? 'scheduled' : 'available'
          }
        })
      } catch (err) {
        console.error('Error updating available slots:', err)
        rescheduleAvailableSlots.value = []
      }
    },
    { deep: true, immediate: true }
  )

  // --- Date change helper ---
  const onDateChange = (newDate: DateValue) => {
    bookingData.value = {
      doctor: bookingData.value.doctor,
      date: newDate
    }
  }

  onMounted(async () => {
    await initializeAuth()
    fetchAllAppointments()
  })

  return {
    allAppointments,
    doctors,
    clinics,
    availableSlots,
    rescheduleAvailableSlots,
    loading,
    error,
    fetchAllAppointments,
    rescheduleAppointment,
    cancelAppointment,
    bookingData,
    onDateChange,
    canModifyAppointment,
    getTimeRemaining
  }
}