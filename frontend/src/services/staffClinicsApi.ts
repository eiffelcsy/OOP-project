import { apiClient } from '@/lib/api'

/**
 * Staff Clinics API Service
 * Wraps staff-scoped clinic endpoints to respect RBAC.
 *
 * These endpoints should only expose clinics that the authenticated staff member
 * is permitted to view.
 */

export interface StaffClinicResponse {
  id: number
  name: string
  addressLine: string | null
  area: string | null
  region: string | null
  clinicType: string | null
  openTime: string | null
  closeTime: string | null
  note: string | null
  remarks: string | null
  createdAt: string | null
  updatedAt: string | null
}

export const staffClinicsApi = {
  /**
   * Get all clinics accessible to the staff user.
   * GET /api/staff/clinics
   */
  async getAllClinics(): Promise<StaffClinicResponse[]> {
    return apiClient.get('/api/staff/clinics')
  },

  /**
   * Get a specific clinic accessible to the staff user.
   * GET /api/staff/clinics/{id}
   */
  async getClinicById(id: number): Promise<StaffClinicResponse> {
    return apiClient.get(`/api/staff/clinics/${id}`)
  }
}


