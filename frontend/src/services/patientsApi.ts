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

export interface QueueTicketResponse {
  id: number
  queue_id: number
  appointment_id: number
  patient_name: string | null
  ticket_number: number
  priority: number
  ticket_status: 'Checked In' | 'Called' | 'Completed' | 'No Show'
  called_at: string | null
  completed_at: string | null
  no_show_at: string | null
  created_at: string
  updated_at: string
}

export interface PatientQueueResponse { // Response when patient has an active queue
  queue_id: number
  current_ticket: QueueTicketResponse[]
  queue_tickets: QueueTicketResponse[]
}

export interface NoQueueResponse { // Response when patient has no active queue
  message: string
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
  },

  /**
   * Get patient's queue information
   * GET /api/patient/{patientId}/queue
   */
  async getPatientQueueInfo(patientId: number): Promise<PatientQueueResponse | NoQueueResponse> {
    return apiClient.get(`/api/patient/${patientId}/queue`)
  }
  
}

