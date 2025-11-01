import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/features/auth/composables/useAuth'

export function useAllAppointments() {
  const { currentUser, initializeAuth } = useAuth()

  const allAppointments = ref<any[]>([])
  const doctors = ref<any[]>([])
  const clinics = ref<any[]>([])

  // Timeslots for rescheduling
  const rescheduleAvailableSlots = ref<{ id: number; slot_start: string; status: string }[]>([])

  // Generate dummy timeslots (24-hour format)
  const generateDummySlots = () => {
    rescheduleAvailableSlots.value = Array.from({ length: 8 }).map((_, idx) => ({
      id: idx + 1,
      slot_start: `${(9 + idx).toString().padStart(2, '0')}:00`,
      status: Math.random() > 0.2 ? 'available' : 'unavailable'
    }))
  }

  // Fetch doctors for a clinic
  const fetchDoctors = async (clinicId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/doctors/clinic/${clinicId}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')
      doctors.value = await res.json()
    } catch (err) {
      console.error('Error fetching doctors:', err)
    }
  }

  // Fetch appointments
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
        const timeStr = start ? start.getHours().toString().padStart(2, '0') + ':' + start.getMinutes().toString().padStart(2, '0') : '-'

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

  const cancelAppointment = async (appointmentId: number) => {
    try {
      const appointment = allAppointments.value.find(apt => apt.id === appointmentId)
      if (!appointment) return false

      // Call the DELETE endpoint
      const res = await fetch(`http://localhost:8080/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        credentials: 'include', // include cookies/session if your backend uses authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (res.status === 403) {
        alert('You are not authorized to cancel this appointment.')
        return false
      }

      if (!res.ok) {
        throw new Error('Failed to cancel appointment on server')
      }

      if (res.status === 200) {
        // Update local state
        appointment.status = 'cancelled'
        alert('Appointment cancelled successfully.')
        return true
      }
    } catch (error) {
      console.error('Cancel appointment failed:', error)
      alert('Failed to cancel appointment. Please try again.')
      return false
    }
  }

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
    generateDummySlots()
  })

  return {
    allAppointments,
    doctors,
    clinics,
    cancelAppointment,
    rescheduleAppointment,
    formatDate,
    formatTime,
    fetchAllAppointments,
    rescheduleAvailableSlots,
    generateDummySlots
  }
}
