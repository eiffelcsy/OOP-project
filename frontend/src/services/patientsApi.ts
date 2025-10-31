import { apiClient } from '@/lib/api'

/**
 * Patients API Service
 * Handles all HTTP requests to the Patients backend endpoints
 * 
 * Note: Patient list/detail endpoints are staff-facing and use /api/staff/patients
 */

export interface PatientResponse {
  id: number
  user_id: string | null
  nric: string
  phone: string | null
  created_at: string
  updated_at: string
  // Profile joined fields (if included)
  full_name?: string
  email?: string
  date_of_birth?: string
}

/**
 * Patients API client
 */
export const patientsApi = {
  /**
   * Get all patients (Staff-facing)
   * GET /api/staff/patients
   */
  async getAllPatients(): Promise<PatientResponse[]> {
    return apiClient.get('/api/staff/patients')
  },

  /**
   * Get patient by ID (Staff-facing)
   * GET /api/staff/patients/{id}
   */
  async getPatientById(id: number): Promise<PatientResponse> {
    return apiClient.get(`/api/staff/patients/${id}`)
  }

}

