import { apiClient } from '@/lib/api'

/**
 * Patient Clinics API Service
 * Provides read-only access to clinic data for patient-facing flows.
 *
 * These endpoints are served from /api/patient and enforce patient RBAC policies.
 */

export interface PatientClinicResponse {
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

export const patientClinicsApi = {
  /**
   * Fetch all clinics visible to patients.
   * GET /api/patient/clinics
   */
  async getAllClinics(): Promise<PatientClinicResponse[]> {
    return apiClient.get('/api/patient/clinics')
  }
}


