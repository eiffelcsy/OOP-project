import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'
import type { Tables } from '@/types/supabase'
import type { DateValue } from '@internationalized/date'

export function useAllAppointments() {
  const { currentUser, initializeAuth } = useAuth()

  const allAppointments = ref<any[]>([])
  const doctors = ref<any[]>([])
  const clinics = ref<any[]>([])
  const availableSlots = ref<Tables<'time_slots'>[]>([])

  // Timeslots specifically for rescheduling
  const rescheduleAvailableSlots = ref<Tables<'time_slots'>[]>([])

  // Booking data for watcher
  const bookingData = ref<{ doctor: any; date: DateValue | null }>({ doctor: null, date: null })

  // --- Fetch doctors for a clinic ---
  const fetchDoctors = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/doctors/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')
      doctors.value = await res.json()
    } catch (err) {
      console.error('Error fetching doctors:', err)
    }
  }

  // --- Fetch all appointments ---
  const fetchAllAppointments = async () => {
    try {
      if (!currentUser.value?.staff?.clinic_id) return
      const clinicId = currentUser.value.staff.clinic_id

      await fetchDoctors(clinicId)

      const res = await fetch(`http://localhost:8080/api/staff/appointments/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch appointments')
      let data = await res.json()

      const nowSGT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
      data = data.filter((appt: any) => {
        if (!appt.start_time) return false
        const apptSGT = new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
        return apptSGT >= nowSGT
      })

      const [patientsRes, profilesRes, clinicsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/patient/all`),
        fetch(`http://localhost:8080/api/admin/users`),
        fetch(`http://localhost:8080/api/admin/clinics`)
      ])
      const patients = await patientsRes.json()
      const profiles = await profilesRes.json()
      const clinicsData = await clinicsRes.json()
      clinics.value = clinicsData

      allAppointments.value = data.map((appt: any) => {
        const start = appt.start_time
          ? new Date(new Date(appt.start_time).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
          : null
        const timeStr = start
          ? start.getHours().toString().padStart(2, '0') + ':' + start.getMinutes().toString().padStart(2, '0')
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

        const doctor = doctors.value.find((d: any) => d.id === appt.doctor_id)
        const doctorName = doctor?.name ?? '-'
        const doctorSpecialty = doctor?.specialty ?? '-'

        const clinic = clinics.value.find((c: any) => c.id === appt.clinic_id)
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
        }
      })
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  // --- Generate time slots for rescheduling ---
  const generateTimeSlots = async (doctorId: number, selectedDate: DateValue | string) => {
    if (!doctorId || !selectedDate) return []

    const selectedDateObj = typeof selectedDate === 'string' ? new Date(selectedDate) : new Date(selectedDate.toString())
    const dayOfWeek = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay()
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0]

    const res = await fetch(`http://localhost:8080/api/admin/doctors/${doctorId}/schedules`)
    if (!res.ok) throw new Error('Failed to fetch schedules')
    const schedules = await res.json()

    // Filter schedules valid for that day
    const validSchedules = schedules.filter((sch: any) => {
      const validFrom = new Date(sch.valid_from)
      const validTo = new Date(sch.valid_to)
      return sch.day_of_week === dayOfWeek && selectedDateObj >= validFrom && selectedDateObj <= validTo
    })

    const slots: Tables<'time_slots'>[] = []
    let slotIndex = 1

    validSchedules.forEach((schedule: any) => {
      const slotDuration = schedule.slot_duration_minutes

      // --- Use start_time / end_time from schedule ---
      const toSGTDate = (timeStr: string) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number)
        const d = new Date(selectedDateStr) // start from selected date
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

    rescheduleAvailableSlots.value = slots
    return slots
  }

  // --- Watch for bookingData changes to regenerate slots ---
  watch(
    [() => bookingData.value.doctor, () => bookingData.value.date],
    async ([doctor, date]) => {
      if (!doctor || !date) {
        rescheduleAvailableSlots.value = []
        return
      }

      const generatedSlots = await generateTimeSlots(doctor.id, date)
      const selectedDateStr = new Date(date.toString()).toISOString().split('T')[0]

      const bookedAppointments = allAppointments.value.filter(
        (appt) =>
          appt.doctorId === doctor.id &&
          (appt.status === 'scheduled' || appt.status === 'confirmed') &&
          appt.date === selectedDateStr
      )

      rescheduleAvailableSlots.value = generatedSlots.map((slot) => {
        const slotStart = new Date(slot.slot_start)
        const slotEnd = new Date(slot.slot_end)
        const isBooked = bookedAppointments.some((appt) => {
          const [hours, minutes] = appt.time.split(':').map(Number)
          const apptStart = new Date(`${appt.date}T${appt.time}:00`)
          const apptEnd = new Date(apptStart)
          apptEnd.setMinutes(apptEnd.getMinutes() + 30) // approximate duration
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

  // --- Cancel appointment ---
  const cancelAppointment = async (appointmentId: number) => {
    try {
      const appointment = allAppointments.value.find(apt => apt.id === appointmentId)
      if (!appointment) return false

      const res = await fetch(`http://localhost:8080/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Failed to cancel appointment')
      appointment.status = 'cancelled'
      return true
    } catch (error) {
      console.error('Cancel appointment failed:', error)
      return false
    }
  }

  // --- Reschedule appointment ---
  const rescheduleAppointment = async (id: number, doctorId: number, newDate: string, newTime: string) => {
    const appt = allAppointments.value.find(a => a.id === id)
    const doctor = doctors.value.find(d => d.id === doctorId)
    if (appt && doctor && appt.status !== 'completed') {
      appt.doctorId = doctorId
      appt.doctorName = doctor.name
      appt.date = newDate
      appt.time = newTime
      appt.status = 'rescheduled'
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const formatTime = (time: string) => time

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
    fetchAllAppointments,
    cancelAppointment,
    rescheduleAppointment,
    formatDate,
    formatTime,
    bookingData,
    generateTimeSlots
  }
}
