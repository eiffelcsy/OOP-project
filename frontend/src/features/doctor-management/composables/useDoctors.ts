import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  doctorsApi, 
  type DoctorResponse, 
  type CreateDoctorRequest, 
  type UpdateDoctorRequest 
} from '@/services/doctorsApi'
import type { Tables } from '@/types/supabase'

/**
 * Doctors Composable
 * Handles state management and navigation for doctor-related operations
 */

// Use Supabase types for data model
export type Doctor = Tables<'doctors'>

export function useDoctors() {
  const router = useRouter()
  const doctors = ref<DoctorResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all doctors and update state
   */
  const fetchDoctors = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await doctorsApi.getAllDoctors()
      doctors.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch doctors'
      console.error('Error fetching doctors:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch doctors by clinic ID
   */
  const fetchDoctorsByClinicId = async (clinicId: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await doctorsApi.getDoctorsByClinicId(clinicId)
      doctors.value = data || []
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch doctors for clinic'
      console.error('Error fetching doctors for clinic:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single doctor by ID
   */
  const fetchDoctorById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await doctorsApi.getDoctorById(id)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch doctor'
      console.error('Error fetching doctor:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new doctor and refresh list
   */
  const createDoctor = async (doctorData: CreateDoctorRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await doctorsApi.createDoctor(doctorData)
      
      // Refresh doctors list
      await fetchDoctors()
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create doctor'
      console.error('Error creating doctor:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update doctor and refresh list
   */
  const updateDoctor = async (id: number, doctorData: UpdateDoctorRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await doctorsApi.updateDoctor(id, doctorData)
      
      // Refresh doctors list
      await fetchDoctors()
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update doctor'
      console.error('Error updating doctor:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete doctor and refresh list
   */
  const deleteDoctor = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await doctorsApi.deleteDoctor(id)
      
      // Refresh doctors list
      await fetchDoctors()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete doctor'
      console.error('Error deleting doctor:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Navigate to doctor details page
   */
  const navigateToDoctor = (id: number) => {
    router.push({ name: 'AdminDoctorDetails', params: { id } })
  }

  /**
   * Navigate to create doctor page
   */
  const navigateToCreateDoctor = () => {
    router.push({ name: 'AdminCreateDoctor' })
  }

  return {
    // State
    doctors,
    loading,
    error,
    
    // API operations
    fetchDoctors,
    fetchDoctorsByClinicId,
    fetchDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    
    // Navigation
    navigateToDoctor,
    navigateToCreateDoctor
  }
}

// Re-export types for convenience
export type { 
  DoctorResponse, 
  CreateDoctorRequest, 
  UpdateDoctorRequest 
} from '@/services/doctorsApi'

