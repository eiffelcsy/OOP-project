import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  clinicsApi, 
  type ClinicResponse, 
  type CreateClinicRequest, 
  type UpdateClinicRequest 
} from '@/services/clinicsApi'
import type { Tables } from '@/types/supabase'

/**
 * Clinics Composable
 * Handles state management and navigation for clinic-related operations
 */

// Use Supabase types for data model
export type Clinic = Tables<'clinics'>

export function useClinics() {
  const router = useRouter()
  const clinics = ref<ClinicResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all clinics and update state
   */
  const fetchClinics = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await clinicsApi.getAllClinics()
      clinics.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch clinics'
      console.error('Error fetching clinics:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single clinic by ID
   */
  const fetchClinicById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await clinicsApi.getClinicById(id)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch clinic'
      console.error('Error fetching clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new clinic and refresh list
   */
  const createClinic = async (clinicData: CreateClinicRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await clinicsApi.createClinic(clinicData)
      
      // Refresh clinics list
      await fetchClinics()
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create clinic'
      console.error('Error creating clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update clinic and refresh list
   */
  const updateClinic = async (id: number, clinicData: UpdateClinicRequest) => {
    loading.value = true
    error.value = null
    try {
      const data = await clinicsApi.updateClinic(id, clinicData)
      
      // Refresh clinics list
      await fetchClinics()
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update clinic'
      console.error('Error updating clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete clinic and refresh list
   */
  const deleteClinic = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await clinicsApi.deleteClinic(id)
      
      // Refresh clinics list
      await fetchClinics()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete clinic'
      console.error('Error deleting clinic:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Navigate to clinic details page
   */
  const navigateToClinic = (id: number) => {
    router.push({ name: 'AdminClinicDetails', params: { id } })
  }

  /**
   * Navigate to create clinic page
   */
  const navigateToCreateClinic = () => {
    router.push({ name: 'AdminCreateClinic' })
  }

  return {
    // State
    clinics,
    loading,
    error,
    
    // API operations
    fetchClinics,
    fetchClinicById,
    createClinic,
    updateClinic,
    deleteClinic,
    
    // Navigation
    navigateToClinic,
    navigateToCreateClinic
  }
}

// Re-export types for convenience
export type { 
  ClinicResponse, 
  CreateClinicRequest, 
  UpdateClinicRequest 
} from '@/services/clinicsApi'

