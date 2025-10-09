import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import type { Tables } from '@/types/supabase'

// Type aliases from database
type Clinic = Tables<'clinics'>
type Doctor = Tables<'doctors'>
type TimeSlot = Tables<'time_slots'>

// Custom types for booking flow
type Region = 'Central' | 'North' | 'South' | 'East' | 'North-East' | 'West'
type ClinicType = 'General' | 'Specialist' | 'Polyclinic'

// Booking data interface
interface BookingData {
  clinic: Clinic | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
}

// TODO: Implement API service for backend communication
// import { apiService } from '@/services/api'

/**
 * API Integration Plan for BookAppointment Feature
 * 
 * This composable contains placeholder methods for backend API integration.
 * All API methods are currently commented out and use dummy data.
 * 
 * Required Backend Endpoints (to be defined in the Patient Controller):
 * 1. GET /api/patient/clinics - Fetch all clinics
 * 2. GET /api/patient/clinics/:id/doctors - Fetch doctors for a specific clinic
 * 3. GET /api/patient/doctors/:id/available-slots?date=YYYY-MM-DD - Fetch available time slots
 * 4. POST /api/patient/appointments - Create a new appointment booking
 * 
 * To integrate with backend:
 * 1. Uncomment the API service import
 * 2. Uncomment the placeholder API methods (fetchClinics, fetchDoctorsByClinic, etc.)
 * 3. Uncomment the data loading methods (loadClinics, loadDoctorsForClinic, etc.)
 * 4. Uncomment the API calls in action methods (selectClinic, selectDoctor, etc.)
 * 5. Update the confirmBooking method to use the actual API
 * 6. Add proper error handling and loading states
 * 
 * Current State: Using dummy data for development and testing
 */

export const useBookAppointment = () => {
  // Current step (1-4)
  const currentStep = ref(1)
  
  // Booking data
  const bookingData = ref<BookingData>({
    clinic: null,
    doctor: null,
    date: null,
    timeSlot: null
  })

  // Search and filter states for Step 1
  const clinicSearchQuery = ref('')
  const selectedClinicType = ref<'All' | ClinicType>('All')
  const selectedRegion = ref<'All' | Region>('All')

  // Dummy data for clinics (using database-aligned structure)
  const allClinics = ref<Clinic[]>([
    {
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
    },
    {
      id: 2,
      name: 'Tan Tock Seng Hospital',
      clinic_type: 'General',
      region: 'Central',
      area: 'Novena',
      address_line: '11 Jalan Tan Tock Seng, Singapore 308433',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 3,
      name: 'National University Hospital',
      clinic_type: 'General',
      region: 'West',
      area: 'Kent Ridge',
      address_line: '5 Lower Kent Ridge Road, Singapore 119074',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 4,
      name: 'Mount Elizabeth Hospital',
      clinic_type: 'Specialist',
      region: 'Central',
      area: 'Orchard',
      address_line: '3 Mount Elizabeth, Singapore 228510',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 5,
      name: 'KK Women\'s and Children\'s Hospital',
      clinic_type: 'Specialist',
      region: 'Central',
      area: 'Outram Park',
      address_line: '100 Bukit Timah Road, Singapore 229899',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 6,
      name: 'Changi General Hospital',
      clinic_type: 'General',
      region: 'East',
      area: 'Simei',
      address_line: '2 Simei Street 3, Singapore 529889',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 7,
      name: 'Khoo Teck Puat Hospital',
      clinic_type: 'General',
      region: 'North',
      area: 'Yishun',
      address_line: '90 Yishun Central, Singapore 768828',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    },
    {
      id: 8,
      name: 'Ng Teng Fong General Hospital',
      clinic_type: 'General',
      region: 'West',
      area: 'Jurong East',
      address_line: '1 Jurong East Street 21, Singapore 609606',
      source_ref: null,
      remarks: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      open_time: null,
      close_time: null,
      note: null
    }
  ])

  // Dummy data for doctors (using database-aligned structure)
  const allDoctors = ref<Doctor[]>([
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
      clinic_id: 2,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Dr. David Chen',
      specialty: 'Emergency Medicine',
      clinic_id: 2,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Dr. Rachel Lee',
      specialty: 'Family Medicine',
      clinic_id: 3,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Dr. Andrew Ng',
      specialty: 'Orthopedics',
      clinic_id: 4,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      name: 'Dr. Michelle Teo',
      specialty: 'Pediatrics',
      clinic_id: 5,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 8,
      name: 'Dr. Kevin Lau',
      specialty: 'General Surgery',
      clinic_id: 6,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])

  // Available time slots (using database-aligned structure)
  const availableTimeSlots = ref<TimeSlot[]>([
    { id: 1, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T09:00:00+08:00', slot_end: '2024-01-01T09:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T09:30:00+08:00', slot_end: '2024-01-01T10:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:00:00+08:00', slot_end: '2024-01-01T10:30:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T10:30:00+08:00', slot_end: '2024-01-01T11:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:00:00+08:00', slot_end: '2024-01-01T11:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T11:30:00+08:00', slot_end: '2024-01-01T12:00:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:00:00+08:00', slot_end: '2024-01-01T14:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T14:30:00+08:00', slot_end: '2024-01-01T15:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 9, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:00:00+08:00', slot_end: '2024-01-01T15:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 10, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T15:30:00+08:00', slot_end: '2024-01-01T16:00:00+08:00', status: 'booked', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 11, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:00:00+08:00', slot_end: '2024-01-01T16:30:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 12, doctor_id: 1, clinic_id: 1, slot_start: '2024-01-01T16:30:00+08:00', slot_end: '2024-01-01T17:00:00+08:00', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ])

  // TODO: Replace dummy data with actual API calls
  // Placeholder API methods for backend communication
  /*
  const fetchAllClinics = async (): Promise<Clinic[]> => {
    try {
      // TODO: Implement actual API call to fetch ALL clinics (no filters)
      // Client-side filtering is better for user experience
      // const response = await apiService.get('/api/clinics')
      // return response.data
      return allClinics.value // Temporary fallback to dummy data
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
      throw new Error('Failed to load clinics')
    }
  }

  const fetchDoctorsByClinic = async (clinicId: string): Promise<Doctor[]> => {
    try {
      // TODO: Implement actual API call to fetch doctors by clinic ID
      // const response = await apiService.get(`/api/clinics/${clinicId}/doctors`)
      // return response.data
      return allDoctors.value.filter(doctor => doctor.clinicId === clinicId) // Temporary fallback
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      throw new Error('Failed to load doctors')
    }
  }

  const fetchAvailableTimeSlots = async (doctorId: string, date: string): Promise<TimeSlot[]> => {
    try {
      // TODO: Implement actual API call to fetch available time slots
      // const response = await apiService.get(`/api/doctors/${doctorId}/available-slots`, {
      //   params: { date }
      // })
      // return response.data
      return availableTimeSlots.value.filter(slot => slot.available) // Temporary fallback
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
      throw new Error('Failed to load available time slots')
    }
  }

  const bookAppointmentAPI = async (appointmentData: {
    clinicId: string
    doctorId: string
    date: string
    timeSlotId: string
    patientId?: string
  }): Promise<{ success: boolean; appointmentId?: string; message?: string }> => {
    try {
      // TODO: Implement actual API call to book appointment
      // const response = await apiService.post('/api/appointments', appointmentData)
      // return response.data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Temporary success response
      return {
        success: true,
        appointmentId: `apt_${Date.now()}`,
        message: 'Appointment booked successfully'
      }
    } catch (error) {
      console.error('Failed to book appointment:', error)
      return {
        success: false,
        message: 'Failed to book appointment. Please try again.'
      }
    }
  }
  */

  // Computed properties
  const filteredClinics = computed(() => {
    let filtered = allClinics.value

    // Filter by search query
    if (clinicSearchQuery.value) {
      const query = clinicSearchQuery.value.toLowerCase()
      filtered = filtered.filter((clinic: Clinic) => 
        clinic.name.toLowerCase().includes(query) ||
        (clinic.area && clinic.area.toLowerCase().includes(query)) ||
        (clinic.address_line && clinic.address_line.toLowerCase().includes(query))
      )
    }

    // Filter by type
    if (selectedClinicType.value !== 'All') {
      filtered = filtered.filter((clinic: Clinic) => clinic.clinic_type === selectedClinicType.value)
    }

    // Filter by region
    if (selectedRegion.value !== 'All') {
      filtered = filtered.filter((clinic: Clinic) => clinic.region === selectedRegion.value)
    }

    return filtered
  })

  const availableDoctors = computed(() => {
    if (!bookingData.value.clinic) return []
    // TODO: Replace with actual API call when backend is ready
    // This should trigger fetchDoctorsByClinic(bookingData.value.clinic.id)
    return allDoctors.value.filter((doctor: Doctor) => doctor.clinic_id === bookingData.value.clinic?.id && doctor.active)
  })

  const availableSlots = computed(() => {
    // TODO: Replace with actual API call when backend is ready
    // This should trigger fetchAvailableTimeSlots(doctorId, date) when both doctor and date are selected
    if (!bookingData.value.doctor || !bookingData.value.date) return []
    return availableTimeSlots.value.filter((slot: TimeSlot) => 
      slot.status === 'available' && 
      slot.doctor_id === bookingData.value.doctor?.id
    )
  })

  const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!bookingData.value.clinic
      case 2:
        return !!bookingData.value.doctor
      case 3:
        return !!bookingData.value.date && !!bookingData.value.timeSlot
      case 4:
        return true
      default:
        return false
    }
  })

  const isLastStep = computed(() => currentStep.value === 4)
  const isFirstStep = computed(() => currentStep.value === 1)

  // Actions
  const selectClinic = (clinic: Clinic) => {
    // If clicking the same clinic, deselect it
    if (bookingData.value.clinic?.id === clinic.id) {
      bookingData.value.clinic = null
      bookingData.value.doctor = null
      return
    }
    
    bookingData.value.clinic = clinic
    // Reset doctor when clinic changes
    bookingData.value.doctor = null
    
    // TODO: Uncomment when backend is ready
    // Load doctors for the selected clinic
    // loadDoctorsForClinic(clinic.id)
  }

  const selectDoctor = (doctor: Doctor) => {
    bookingData.value.doctor = doctor
  }

  const selectDate = (date: DateValue) => {
    bookingData.value.date = date
    // Reset time slot when date changes
    bookingData.value.timeSlot = null
    
    // TODO: Uncomment when backend is ready
    // If doctor is already selected, load available slots
    // if (bookingData.value.doctor) {
    //   loadAvailableSlots(bookingData.value.doctor.id, date.toString())
    // }
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
    if (step >= 1 && step <= 4) {
      currentStep.value = step
    }
  }

  const resetBooking = () => {
    currentStep.value = 1
    bookingData.value = {
      clinic: null,
      doctor: null,
      date: null,
      timeSlot: null
    }
    clinicSearchQuery.value = ''
    selectedClinicType.value = 'All'
    selectedRegion.value = 'All'
  }

  // TODO: Uncomment and implement these methods when backend is ready
  /*
  const loadAllClinics = async () => {
    try {
      // Fetch ALL clinics once - no server-side filtering
      // Client-side filtering provides better UX
      const clinics = await fetchAllClinics()
      allClinics.value = clinics
    } catch (error) {
      console.error('Failed to load clinics:', error)
      // Handle error (show toast, etc.)
    }
  }

  const loadDoctorsForClinic = async (clinicId: string) => {
    try {
      const doctors = await fetchDoctorsByClinic(clinicId)
      // Update the doctors list for the specific clinic
      allDoctors.value = allDoctors.value.filter(d => d.clinicId !== clinicId).concat(doctors)
    } catch (error) {
      console.error('Failed to load doctors:', error)
      // Handle error (show toast, etc.)
    }
  }

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    try {
      const slots = await fetchAvailableTimeSlots(doctorId, date)
      availableTimeSlots.value = slots
    } catch (error) {
      console.error('Failed to load time slots:', error)
      // Handle error (show toast, etc.)
    }
  }
  */

  const confirmBooking = async () => {
    try {
      // TODO: Uncomment and use the actual API method when backend is ready
      /*
      if (!bookingData.value.clinic || !bookingData.value.doctor || 
          !bookingData.value.date || !bookingData.value.timeSlot) {
        throw new Error('Missing required booking information')
      }

      const appointmentData = {
        clinicId: bookingData.value.clinic.id,
        doctorId: bookingData.value.doctor.id,
        date: bookingData.value.date.toString(),
        timeSlotId: bookingData.value.timeSlot.id,
        // TODO: Get actual patient ID from auth context
        patientId: 'current-patient-id'
      }

      const result = await bookAppointmentAPI(appointmentData)
      
      if (result.success) {
        console.log('Appointment booked successfully:', result.appointmentId)
        return true
      } else {
        console.error('Booking failed:', result.message)
        return false
      }
      */

      // Temporary simulation for development
      console.log('Booking confirmed:', bookingData.value)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      return true
    } catch (error) {
      console.error('Booking failed:', error)
      return false
    }
  }

  return {
    // State
    currentStep,
    bookingData,
    clinicSearchQuery,
    selectedClinicType,
    selectedRegion,
    
    // Computed
    filteredClinics,
    availableDoctors,
    availableSlots,
    canProceedToNextStep,
    isLastStep,
    isFirstStep,
    
    // Actions
    selectClinic,
    selectDoctor,
    selectDate,
    selectTimeSlot,
    nextStep,
    previousStep,
    goToStep,
    resetBooking,
    confirmBooking
  }
}
