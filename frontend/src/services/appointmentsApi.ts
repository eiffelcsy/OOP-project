import { apiClient } from '@/lib/api'

/**
 * Appointments API Service
 * Handles all HTTP requests to the Appointments backend endpoints
 */

export interface AppointmentResponse {
  id: number
  patient_id: number
  doctor_id: number
  clinic_id: number
  start_time: string
  end_time: string
  status: string
  treatment_summary: string | null
  created_at: string
  updated_at: string
  // Joined fields (if included)
  clinic_name?: string
  clinic_type?: string
  clinic_address?: string
  doctor_name?: string
  specialty?: string
  patient_name?: string
  patient_phone?: string
}

/**
 * Enriched appointment response for staff views
 * Includes all necessary joined data
 */
export interface StaffAppointmentResponse {
  id: number
  patient_id: number
  doctor_id: number
  clinic_id: number
  start_time: string
  end_time: string
  status: string
  treatment_summary: string | null
  created_at: string
  updated_at: string
  // Enriched fields
  patient_name: string
  patient_phone: string
  doctor_name: string
  doctor_specialty: string | null
  clinic_name: string
  clinic_type: string
  clinic_address: string | null
  duration_minutes: number | null
}

export interface CreateAppointmentRequest {
  patient_id: number
  doctor_id: number
  clinic_id: number
  start_time: string
  end_time: string
  treatment_summary?: string | null
}

export interface UpdateAppointmentRequest {
  start_time?: string
  end_time?: string
  status?: string
  treatment_summary?: string | null
}

/**
 * Appointments API client
 */
export const appointmentsApi = {
  /**
   * Get all appointments for a patient
   * GET /api/patient/appointments
   */
  async getPatientAppointments(): Promise<AppointmentResponse[]> {
    return apiClient.get('/api/patient/appointments')
  },

  /**
   * Get all appointments for a clinic
   * GET /api/staff/appointments/clinic/{clinicId}
   */
  async getClinicAppointments(clinicId: number): Promise<AppointmentResponse[]> {
    return apiClient.get(`/api/staff/appointments/clinic/${clinicId}`)
  },

  /**
   * Get all appointments for a doctor
   * GET /api/staff/appointments?doctorId={doctorId}
   */
  async getDoctorAppointments(doctorId: number): Promise<AppointmentResponse[]> {
    return apiClient.get(`/api/staff/appointments?doctorId=${doctorId}`)
  },

  /**
   * Create a new appointment
   * POST /api/appointments
   */
  async createAppointment(appointmentData: CreateAppointmentRequest, idempotencyKey?: string): Promise<AppointmentResponse> {
    // Custom implementation to add idempotency key
    const token = await apiClient.ensureToken()
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    const API_BASE = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8080'
    const response = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(appointmentData)
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      const err: any = new Error(errorMessage)
      err.status = response.status
      throw err
    }

    return response.json()
  },

  /**
   * Create appointment specifically for patient-facing flow
   * POST /api/patient/appointments
   */
  async createPatientAppointment(appointmentData: CreateAppointmentRequest, idempotencyKey?: string): Promise<AppointmentResponse> {
    // Duplicate of createAppointment but posts to patient endpoint
    const token = await apiClient.ensureToken()
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    const API_BASE = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8080'
    const response = await fetch(`${API_BASE}/api/patient/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(appointmentData)
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      const err: any = new Error(errorMessage)
      err.status = response.status
      throw err
    }

    return response.json()
  },

  /**
   * Update an appointment (reschedule)
   * PUT /api/appointments/{id}?newStartTime={start}&newEndTime={end}
   */
  async updateAppointment(
    id: number, 
    newStartTime?: string, 
    newEndTime?: string
  ): Promise<AppointmentResponse> {
    const params = new URLSearchParams()
    if (newStartTime) params.append('newStartTime', newStartTime)
    if (newEndTime) params.append('newEndTime', newEndTime)
    
    const queryString = params.toString()
    const endpoint = queryString ? `/api/appointments/${id}?${queryString}` : `/api/appointments/${id}`
    
    return apiClient.put(endpoint, {})
  },

  /**
   * Update an appointment for the authenticated patient (reschedule)
   * PUT /api/patient/appointments/{id}?newStartTime={start}&newEndTime={end}
   */
  async updateAppointmentForPatient(
    id: number,
    newStartTime?: string,
    newEndTime?: string
  ): Promise<AppointmentResponse> {
    const params = new URLSearchParams()
    if (newStartTime) params.append('newStartTime', newStartTime)
    if (newEndTime) params.append('newEndTime', newEndTime)
    const queryString = params.toString()
    const endpoint = queryString ? `/api/patient/appointments/${id}?${queryString}` : `/api/patient/appointments/${id}`

    return apiClient.put(endpoint, {})
  },

  /**
   * Cancel an appointment
   * DELETE /api/appointments/{id}
   */
  async cancelAppointment(id: number): Promise<void> {
    return apiClient.delete(`/api/appointments/${id}`)
  },

  /**
   * Get today's appointments for a clinic with enriched data
   * GET /api/staff/appointments/today/{clinicId}
   * Returns appointments with patient names, doctor names, clinic info, etc.
   */
  async getTodaysClinicAppointments(clinicId: number): Promise<StaffAppointmentResponse[]> {
    return apiClient.get(`/api/staff/appointments/today/${clinicId}`)
  }
}

