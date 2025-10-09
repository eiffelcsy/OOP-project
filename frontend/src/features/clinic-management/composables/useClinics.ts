import { ref } from 'vue'
import { apiClient } from '@/lib/api'
import { useRouter } from 'vue-router'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

// Use the generated Supabase types
export type Clinic = Tables<'clinics'>
export type ClinicInsert = TablesInsert<'clinics'>
export type ClinicUpdate = TablesUpdate<'clinics'>

export function useClinics() {
  const router = useRouter()
  const clinics = ref<Clinic[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all clinics from Spring Boot backend
  const fetchClinics = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await apiClient.get('/api/admin/clinics')
      clinics.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch clinics'
      console.error('Error fetching clinics:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch single clinic by ID from Spring Boot backend
  const fetchClinicById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await apiClient.get(`/api/admin/clinics/${id}`)
      return data as Clinic
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch clinic'
      console.error('Error fetching clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create new clinic via Spring Boot backend
  const createClinic = async (clinicData: Partial<Clinic>) => {
    loading.value = true
    error.value = null
    try {
      const data = await apiClient.post('/api/admin/clinics', clinicData)
      
      // Refresh clinics list
      await fetchClinics()
      
      return data as Clinic
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create clinic'
      console.error('Error creating clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Update clinic via Spring Boot backend
  const updateClinic = async (id: number, clinicData: Partial<Clinic>) => {
    loading.value = true
    error.value = null
    try {
      const data = await apiClient.put(`/api/admin/clinics/${id}`, clinicData)
      
      // Refresh clinics list
      await fetchClinics()
      
      return data as Clinic
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update clinic'
      console.error('Error updating clinic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Delete clinic via Spring Boot backend
  const deleteClinic = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/api/admin/clinics/${id}`)
      
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

  // Navigate to clinic details
  const navigateToClinic = (id: number) => {
    router.push({ name: 'AdminClinicDetails', params: { id } })
  }

  // Navigate to create clinic
  const navigateToCreateClinic = () => {
    router.push({ name: 'AdminCreateClinic' })
  }

  return {
    clinics,
    loading,
    error,
    fetchClinics,
    fetchClinicById,
    createClinic,
    updateClinic,
    deleteClinic,
    navigateToClinic,
    navigateToCreateClinic
  }
}

