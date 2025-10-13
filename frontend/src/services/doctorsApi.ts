import { apiClient } from '@/lib/api'
import type { Tables } from '@/types/supabase'

/**
 * Doctor API Service
 * Handles all HTTP requests to the Doctor backend endpoints
 */

// Use Supabase generated types
export type Doctor = Tables<'doctors'>

// Backend response type (with snake_case from Jackson)
export interface DoctorResponse {
  id: number
  clinicId: number
  name: string
  specialty: string | null
  active: boolean | null
  createdAt: string  // OffsetDateTime from backend
  updatedAt: string  // OffsetDateTime from backend
}

export interface CreateDoctorRequest {
  clinicId: number
  name: string
  specialty?: string | null
  active?: boolean
}

export interface UpdateDoctorRequest {
  name?: string
  specialty?: string | null
  active?: boolean
  clinicId?: number
}

/**
 * Doctor API client
 */
export const doctorsApi = {
  /**
   * Get all doctors
   * GET /api/admin/doctors
   */
  async getAllDoctors(): Promise<DoctorResponse[]> {
    return apiClient.get('/api/admin/doctors')
  },

  /**
   * Get doctors by clinic ID
   * GET /api/admin/doctors/clinic/{clinicId}
   */
  async getDoctorsByClinicId(clinicId: number): Promise<DoctorResponse[]> {
    return apiClient.get(`/api/admin/doctors/clinic/${clinicId}`)
  },

  /**
   * Get doctor by ID
   * GET /api/admin/doctors/{id}
   */
  async getDoctorById(id: number): Promise<DoctorResponse> {
    return apiClient.get(`/api/admin/doctors/${id}`)
  },

  /**
   * Create a new doctor
   * POST /api/admin/doctors
   */
  async createDoctor(doctorData: CreateDoctorRequest): Promise<DoctorResponse> {
    return apiClient.post('/api/admin/doctors', doctorData)
  },

  /**
   * Update an existing doctor
   * PUT /api/admin/doctors/{id}
   */
  async updateDoctor(id: number, doctorData: UpdateDoctorRequest): Promise<DoctorResponse> {
    return apiClient.put(`/api/admin/doctors/${id}`, doctorData)
  },

  /**
   * Delete a doctor
   * DELETE /api/admin/doctors/{id}
   */
  async deleteDoctor(id: number): Promise<void> {
    return apiClient.delete(`/api/admin/doctors/${id}`)
  }
}

