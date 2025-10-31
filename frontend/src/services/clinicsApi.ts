import { apiClient } from '@/lib/api'
import type { Tables } from '@/types/supabase'

/**
 * Clinic API Service
 * Handles all HTTP requests to the Clinic backend endpoints
 */

// Use Supabase generated types
export type Clinic = Tables<'clinics'>

// Backend response type (with snake_case from Jackson SNAKE_CASE configuration)
export interface ClinicResponse {
  id: number
  name: string
  address_line: string | null
  area: string | null
  region: string | null
  clinic_type: string | null
  open_time: string | null  // LocalTime from backend
  close_time: string | null  // LocalTime from backend
  note: string | null
  remarks: string | null
  created_at: string  // LocalDateTime from backend
  updated_at: string  // LocalDateTime from backend
}

export interface CreateClinicRequest {
  name: string
  address_line?: string | null
  area?: string | null
  region?: string | null
  clinic_type?: string | null
  open_time?: string | null
  close_time?: string | null
  note?: string | null
  remarks?: string | null
}

export interface UpdateClinicRequest {
  name?: string
  address_line?: string | null
  area?: string | null
  region?: string | null
  clinic_type?: string | null
  open_time?: string | null
  close_time?: string | null
  note?: string | null
  remarks?: string | null
}

/**
 * Clinic API client
 */
export const clinicsApi = {
  /**
   * Get all clinics
   * GET /api/admin/clinics
   */
  async getAllClinics(): Promise<ClinicResponse[]> {
    return apiClient.get('/api/admin/clinics')
  },

  /**
   * Get clinic by ID
   * GET /api/admin/clinics/{id}
   */
  async getClinicById(id: number): Promise<ClinicResponse> {
    return apiClient.get(`/api/admin/clinics/${id}`)
  },

  /**
   * Create a new clinic
   * POST /api/admin/clinics
   */
  async createClinic(clinicData: CreateClinicRequest): Promise<ClinicResponse> {
    return apiClient.post('/api/admin/clinics', clinicData)
  },

  /**
   * Update an existing clinic
   * PUT /api/admin/clinics/{id}
   */
  async updateClinic(id: number, clinicData: UpdateClinicRequest): Promise<ClinicResponse> {
    return apiClient.put(`/api/admin/clinics/${id}`, clinicData)
  },

  /**
   * Delete a clinic
   * DELETE /api/admin/clinics/{id}
   */
  async deleteClinic(id: number): Promise<void> {
    return apiClient.delete(`/api/admin/clinics/${id}`)
  }
}

