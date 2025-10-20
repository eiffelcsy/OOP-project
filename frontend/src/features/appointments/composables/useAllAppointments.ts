import { ref } from 'vue'

export function useAllAppointments() {
  const allAppointments = ref<any[]>([
    {
      id: 1,
      patientName: 'John Tan',
      doctorId: 101,
      doctorName: 'Dr. Lee Wei Ming',
      clinicId: 201,
      clinicName: 'City Clinic',
      type: 'General Consultation',
      doctorSpecialty: 'General Practitioner',
      clinicType: 'GENERAL',
      date: '2025-10-20',
      time: '10:00',
      status: 'scheduled'
    },
    {
      id: 2,
      patientName: 'Alicia Lim',
      doctorId: 102,
      doctorName: 'Dr. Rajesh Kumar',
      clinicId: 202,
      clinicName: 'Dental Care Centre',
      type: 'Dental Cleaning',
      doctorSpecialty: 'Dentist',
      clinicType: 'DENTAL',
      date: '2025-10-22',
      time: '09:30',
      status: 'scheduled'
    },
    {
      id: 3,
      patientName: 'Marcus Ong',
      doctorId: 103,
      doctorName: 'Dr. Fiona Tan',
      clinicId: 203,
      clinicName: 'Vision Hub',
      type: 'Eye Check-up',
      doctorSpecialty: 'Ophthalmologist',
      clinicType: 'EYE',
      date: '2025-10-18',
      time: '14:00',
      status: 'completed'
    }
  ])

  const doctors = ref([
    { id: 101, name: 'Dr. Lee Wei Ming', specialty: 'General Practitioner' },
    { id: 102, name: 'Dr. Rajesh Kumar', specialty: 'Dentist' },
    { id: 103, name: 'Dr. Fiona Tan', specialty: 'Ophthalmologist' }
  ])

  const clinics = ref([
    { id: 201, name: 'City Clinic', clinicType: 'GENERAL' },
    { id: 202, name: 'Dental Care Centre', clinicType: 'DENTAL' },
    { id: 203, name: 'Vision Hub', clinicType: 'EYE' }
  ])

  const fetchAllAppointments = async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const cancelAppointment = async (id: number) => {
    const appt = allAppointments.value.find(a => a.id === id)
    if (appt && appt.status !== 'completed') {
      appt.status = 'cancelled'
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

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-SG', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
  const formatTime = (time: string) => time

  return {
    allAppointments,
    doctors,
    clinics,
    cancelAppointment,
    rescheduleAppointment,
    formatDate,
    formatTime,
    fetchAllAppointments
  }
}
