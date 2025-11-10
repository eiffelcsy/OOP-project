import { apiClient } from '@/lib/api'
import type { AppointmentResponse, StaffAppointmentResponse, CreateAppointmentRequest } from '@/services/appointmentsApi'

/**
 * Staff Appointments API Service
 * Handles all HTTP requests to the Staff Appointments backend endpoints
 * All endpoints use /api/staff/appointments
 */

export const staffAppointmentsApi = {
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
    return apiClient.get(`/api/staff/doctors/${doctorId}/appointments`)
  },

  /**
   * Get all appointments with optional filters
   * GET /api/staff/appointments?doctorId={doctorId}&clinicId={clinicId}&status={status}
   */
  async getAppointments(filters?: {
    doctorId?: number
    clinicId?: number
    status?: string
  }): Promise<AppointmentResponse[]> {
    const params = new URLSearchParams()
    if (filters?.doctorId) params.append('doctorId', filters.doctorId.toString())
    if (filters?.clinicId) params.append('clinicId', filters.clinicId.toString())
    if (filters?.status) params.append('status', filters.status)

    const queryString = params.toString()
    const endpoint = queryString ? `/api/staff/appointments?${queryString}` : '/api/staff/appointments'
    return apiClient.get(endpoint)
  },

  /**
   * Get today's appointments for a clinic with enriched data
   * GET /api/staff/appointments/today/{clinicId}
   * Returns appointments with patient names, doctor names, clinic info, etc.
   */
  async getTodaysClinicAppointments(clinicId: number): Promise<StaffAppointmentResponse[]> {
    return apiClient.get(`/api/staff/appointments/today/${clinicId}`)
  },

  /**
   * Create a new appointment (staff-facing)
   * POST /api/staff/appointments
   */
  async createAppointment(appointmentData: CreateAppointmentRequest, idempotencyKey?: string): Promise<AppointmentResponse> {
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
    const response = await fetch(`${API_BASE}/api/staff/appointments`, {
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
   * Update an appointment (reschedule) - staff-facing
   * PUT /api/staff/appointments/{id}?newStartTime={start}&newEndTime={end}
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
    const endpoint = queryString ? `/api/staff/appointments/${id}?${queryString}` : `/api/staff/appointments/${id}`

    return apiClient.put(endpoint, {})
  },

  /**
   * Update appointment status - staff-facing
   * PUT /api/staff/appointments/{id}/status
   */
  async updateAppointmentStatus(id: number, status: string): Promise<AppointmentResponse> {
    console.log(`[API] Calling PUT /api/staff/appointments/${id}/status with status:`, status)
    try {
      const response = await apiClient.put(`/api/staff/appointments/${id}/status`, { status })
      console.log('[API] Response received:', response)
      return response
    } catch (error) {
      console.error('[API] Error in updateAppointmentStatus:', error)
      throw error
    }
  },

  /**
   * Cancel an appointment - staff-facing
   * DELETE /api/staff/appointments/{id}
   */
  async cancelAppointment(id: number): Promise<void> {
    return apiClient.delete(`/api/staff/appointments/${id}`)
  }
}

