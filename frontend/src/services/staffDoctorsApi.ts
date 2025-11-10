import { apiClient } from '@/lib/api'
import type { DoctorResponse } from '@/services/adminDoctorsApi'

/**
 * Staff Doctors API Service
 * Handles all HTTP requests to the Staff Doctors backend endpoints
 */

export const staffDoctorsApi = {
  /**
   * Get doctors by clinic ID (Staff-facing)
   * GET /api/staff/doctors/clinic/{clinicId}
   */
  async getDoctorsByClinicId(clinicId: number): Promise<DoctorResponse[]> {
    return apiClient.get(`/api/staff/doctors/clinic/${clinicId}`)
  }
}