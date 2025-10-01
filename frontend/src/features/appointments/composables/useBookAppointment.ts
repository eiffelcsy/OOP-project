import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'

// Types for our booking data
export interface Clinic {
  id: string
  name: string
  type: 'General' | 'Specialist'
  region: 'Central' | 'West' | 'East' | 'North-East' | 'North'
  location: string
  address: string
  image?: string
}

export interface Doctor {
  id: string
  name: string
  specialization: string
  clinicId: string
  image?: string
  experience: string
}

export interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export interface BookingData {
  clinic: Clinic | null
  doctor: Doctor | null
  date: DateValue | null
  timeSlot: TimeSlot | null
}

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
  const selectedClinicType = ref<'All' | 'General' | 'Specialist'>('All')
  const selectedRegion = ref<'All' | 'Central' | 'West' | 'East' | 'North-East' | 'North'>('All')

  // Dummy data for clinics
  const allClinics = ref<Clinic[]>([
    {
      id: '1',
      name: 'Singapore General Hospital',
      type: 'General',
      region: 'Central',
      location: 'Outram Park',
      address: 'Outram Road, Singapore 169608'
    },
    {
      id: '2',
      name: 'Tan Tock Seng Hospital',
      type: 'General',
      region: 'Central',
      location: 'Novena',
      address: '11 Jalan Tan Tock Seng, Singapore 308433'
    },
    {
      id: '3',
      name: 'National University Hospital',
      type: 'General',
      region: 'West',
      location: 'Kent Ridge',
      address: '5 Lower Kent Ridge Road, Singapore 119074'
    },
    {
      id: '4',
      name: 'Mount Elizabeth Hospital',
      type: 'Specialist',
      region: 'Central',
      location: 'Orchard',
      address: '3 Mount Elizabeth, Singapore 228510'
    },
    {
      id: '5',
      name: 'KK Women\'s and Children\'s Hospital',
      type: 'Specialist',
      region: 'Central',
      location: 'Outram Park',
      address: '100 Bukit Timah Road, Singapore 229899'
    },
    {
      id: '6',
      name: 'Changi General Hospital',
      type: 'General',
      region: 'East',
      location: 'Simei',
      address: '2 Simei Street 3, Singapore 529889'
    },
    {
      id: '7',
      name: 'Khoo Teck Puat Hospital',
      type: 'General',
      region: 'North',
      location: 'Yishun',
      address: '90 Yishun Central, Singapore 768828'
    },
    {
      id: '8',
      name: 'Ng Teng Fong General Hospital',
      type: 'General',
      region: 'West',
      location: 'Jurong East',
      address: '1 Jurong East Street 21, Singapore 609606'
    }
  ])

  // Dummy data for doctors
  const allDoctors = ref<Doctor[]>([
    {
      id: '1',
      name: 'Dr. Sarah Lim',
      specialization: 'General Medicine',
      clinicId: '1',
      experience: '12 years experience'
    },
    {
      id: '2',
      name: 'Dr. Michael Tan',
      specialization: 'Cardiology',
      clinicId: '1',
      experience: '15 years experience'
    },
    {
      id: '3',
      name: 'Dr. Jennifer Wong',
      specialization: 'Internal Medicine',
      clinicId: '2',
      experience: '8 years experience'
    },
    {
      id: '4',
      name: 'Dr. David Chen',
      specialization: 'Emergency Medicine',
      clinicId: '2',
      experience: '10 years experience'
    },
    {
      id: '5',
      name: 'Dr. Rachel Lee',
      specialization: 'Family Medicine',
      clinicId: '3',
      experience: '7 years experience'
    },
    {
      id: '6',
      name: 'Dr. Andrew Ng',
      specialization: 'Orthopedics',
      clinicId: '4',
      experience: '18 years experience'
    },
    {
      id: '7',
      name: 'Dr. Michelle Teo',
      specialization: 'Pediatrics',
      clinicId: '5',
      experience: '9 years experience'
    },
    {
      id: '8',
      name: 'Dr. Kevin Lau',
      specialization: 'General Surgery',
      clinicId: '6',
      experience: '14 years experience'
    }
  ])

  // Available time slots
  const availableTimeSlots = ref<TimeSlot[]>([
    { id: '1', time: '09:00 AM', available: true },
    { id: '2', time: '09:30 AM', available: true },
    { id: '3', time: '10:00 AM', available: false },
    { id: '4', time: '10:30 AM', available: true },
    { id: '5', time: '11:00 AM', available: true },
    { id: '6', time: '11:30 AM', available: false },
    { id: '7', time: '02:00 PM', available: true },
    { id: '8', time: '02:30 PM', available: true },
    { id: '9', time: '03:00 PM', available: true },
    { id: '10', time: '03:30 PM', available: false },
    { id: '11', time: '04:00 PM', available: true },
    { id: '12', time: '04:30 PM', available: true }
  ])

  // Computed properties
  const filteredClinics = computed(() => {
    let filtered = allClinics.value

    // Filter by search query
    if (clinicSearchQuery.value) {
      const query = clinicSearchQuery.value.toLowerCase()
      filtered = filtered.filter(clinic => 
        clinic.name.toLowerCase().includes(query) ||
        clinic.location.toLowerCase().includes(query) ||
        clinic.address.toLowerCase().includes(query)
      )
    }

    // Filter by type
    if (selectedClinicType.value !== 'All') {
      filtered = filtered.filter(clinic => clinic.type === selectedClinicType.value)
    }

    // Filter by region
    if (selectedRegion.value !== 'All') {
      filtered = filtered.filter(clinic => clinic.region === selectedRegion.value)
    }

    return filtered
  })

  const availableDoctors = computed(() => {
    if (!bookingData.value.clinic) return []
    return allDoctors.value.filter(doctor => doctor.clinicId === bookingData.value.clinic?.id)
  })

  const availableSlots = computed(() => {
    return availableTimeSlots.value.filter(slot => slot.available)
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
  }

  const selectDoctor = (doctor: Doctor) => {
    bookingData.value.doctor = doctor
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

  const confirmBooking = async () => {
    // Simulate API call
    try {
      console.log('Booking confirmed:', bookingData.value)
      // Here you would make an actual API call to book the appointment
      // await bookAppointment(bookingData.value)
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
