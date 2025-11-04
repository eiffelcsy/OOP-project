import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import type { Tables } from '@/types/supabase'
import type { DateValue } from '@internationalized/date'

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

  // Utility function for API calls with error handling
  const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      return await response.json()
    } catch (err) {
      console.error('API call failed:', err)
      throw err
    }
  }

  // --- Fetch doctors ---
  const fetchDoctors = async (clinicId: number) => {
    try {
      doctors.value = await fetchWithErrorHandling(
        `http://localhost:8080/api/admin/doctors/clinic/${clinicId}`
      )

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

      const data = await fetchWithErrorHandling(
        `http://localhost:8080/api/staff/appointments/clinic/${clinicId}`
      )

      // Filter out past appointments (SGT timezone)
      const nowSGT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
      const upcomingAppointments = data.filter((appt: any) => {
        if (!appt.start_time) return false
        const apptSGT = new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
        return apptSGT >= nowSGT
      })

      // Fetch related data in parallel
      const [patients, profiles, clinicsData] = await Promise.all([
        fetchWithErrorHandling('http://localhost:8080/api/patient/all'),
        fetchWithErrorHandling('http://localhost:8080/api/admin/users'),
        fetchWithErrorHandling('http://localhost:8080/api/admin/clinics')
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

      const appointment = allAppointments.value.find(apt => apt.id === appointmentId)
      if (!appointment) {
        throw new Error('Appointment not found')
      }

      await fetchWithErrorHandling(`http://localhost:8080/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      // Update local state
      appointment.status = 'cancelled'
      return true
    } catch (err) {
      console.error('Cancel appointment failed:', err)
      error.value = 'Failed to cancel appointment'
      return false
    }
  }

  // --- Generate timeslots ---
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue | string) => {
    if (!doctorId || !selectedDate) return []

    try {
      const selectedDateObj = typeof selectedDate === 'string'
        ? new Date(selectedDate)
        : new Date(selectedDate.toString())

      const dayOfWeek = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay()
      const selectedDateStr = selectedDateObj.toISOString().split('T')[0]

      const schedules = await fetchWithErrorHandling(
        `http://localhost:8080/api/admin/doctors/${doctorId}/schedules`
      )

      const validSchedules = schedules.filter((sch: any) => {
        const validFrom = new Date(sch.valid_from)
        const validTo = new Date(sch.valid_to)
        return sch.day_of_week === dayOfWeek && selectedDateObj >= validFrom && selectedDateObj <= validTo
      })

      const slots: Tables<'time_slots'>[] = []
      let slotIndex = 1

      validSchedules.forEach((schedule: any) => {
        const slotDuration = schedule.slot_duration_minutes

        const toSGTDate = (timeStr: string) => {
          const [hours, minutes, seconds] = timeStr.split(':').map(Number)
          const d = new Date(selectedDateStr)
          d.setHours(hours + 8, minutes, seconds || 0, 0) // add +8 for SGT
          return d
        }

        let current = toSGTDate(schedule.start_time)
        const endTime = toSGTDate(schedule.end_time)

        while (current < endTime) {
          const slotEnd = new Date(current)
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

          slots.push({
            id: slotIndex++,
            doctor_id: doctorId,
            clinic_id: currentUser.value?.staff?.clinic_id ?? 0,
            slot_start: `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`,
            slot_end: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          current = slotEnd
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
    newTime: string
  ) => {
    try {
      error.value = null

      const appointment = allAppointments.value.find((apt: Appointment) => apt.id === appointmentId)
      if (!appointment) {
        throw new Error("Appointment not found locally")
      }

      console.log("[RESCHEDULE] Starting reschedule for appointment:", appointmentId)
      console.log("[RESCHEDULE] Selected date:", newDate)
      console.log("[RESCHEDULE] Selected time:", newTime)

      // Parse selected date
      const selectedDateObj = typeof newDate === "string"
        ? new Date(newDate)
        : new Date(newDate.toString())

      const selectedDateStr = selectedDateObj.toISOString().split("T")[0]

      // Convert SGT time to UTC properly
      const [hours, minutes] = newTime.split(":").map(Number)

      // Create date in SGT timezone (UTC+8)
      const sgtDateString = `${selectedDateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00+08:00`
      const sgtDate = new Date(sgtDateString)

      // Convert to UTC
      const newStartTime = sgtDate.toISOString()

      // Use 30 minutes as default duration
      const slotDuration = 30
      const endDateTime = new Date(sgtDate.getTime() + slotDuration * 60 * 1000)
      const newEndTime = endDateTime.toISOString()

      console.log("[RESCHEDULE] Final UTC times:")
      console.log("  - Start:", newStartTime)
      console.log("  - End:", newEndTime)

      // Build URL with query params
      const params = new URLSearchParams({
        newStartTime,
        newEndTime
      })

      const url = `http://localhost:8080/api/appointments/${appointmentId}?${params.toString()}`
      console.log("[RESCHEDULE] Calling URL:", url)

      await fetchWithErrorHandling(url, { method: "PUT" })

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
        const generatedSlots = await generateTimeSlots(doctor.id, date)
        const selectedDateStr = new Date(date.toString()).toISOString().split('T')[0]

        const bookedAppointments = allAppointments.value.filter(
          (appt) =>
            appt.doctorId === doctor.id &&
            (appt.status === 'scheduled' || appt.status === 'confirmed') &&
            appt.date === selectedDateStr
        )

        rescheduleAvailableSlots.value = generatedSlots.map((slot) => {
          const slotStart = new Date(`${selectedDateStr}T${slot.slot_start}:00`)
          const slotEnd = new Date(`${selectedDateStr}T${slot.slot_end}:00`)

          const isBooked = bookedAppointments.some((appt) => {
            const apptStart = new Date(`${appt.date}T${appt.time}:00`)
            const apptEnd = new Date(apptStart)
            apptEnd.setMinutes(apptEnd.getMinutes() + 30)
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
    onDateChange
  }
}