import { apiClient } from '@/lib/api'

/**
 * Patient Doctors API Service
 * Provides patient-scoped access to doctor data.
 *
 * Backed by PatientController endpoints which enforce patient RBAC.
 */

export interface PatientDoctorResponse {
  id: number
  clinicId: number
  name: string
  specialty: string | null
  active: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

export const patientDoctorsApi = {
  /**
   * Get doctors for a clinic (patient-facing)
   * GET /api/patient/doctors/clinic/{clinicId}
   */
  async getDoctorsByClinicId(clinicId: number): Promise<PatientDoctorResponse[]> {
    return apiClient.get(`/api/patient/doctors/clinic/${clinicId}`)
  },
  
  /**
   * Get doctor by ID (patient-facing)
   * GET /api/patient/doctors/{doctorId}
   */
  async getDoctorById(doctorId: number): Promise<PatientDoctorResponse> {
    return apiClient.get(`/api/patient/doctors/${doctorId}`)
  }
}


