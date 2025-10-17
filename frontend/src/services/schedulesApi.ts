/**
 * Schedules API Service
 * Handles all schedule-related API calls to the backend
 */

// Normalize Vite-provided base URL. Users may set VITE_API_BASE_URL to include
// a trailing '/api' or not; handle both cases so callers don't accidentally
// produce requests like 'http://host:port/api/api/...'. Also strip trailing
// slashes for a consistent join.
const _rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const _trimmed = (_rawApiBase as string).replace(/\/+$/, '')
// If the provided base ends with '/api' assume it already contains the API
// prefix and do not add another '/api' when building endpoints. Otherwise
// add '/api' as the canonical API prefix used by the backend.
const API_BASE_URL = _trimmed.endsWith('/api') ? _trimmed : `${_trimmed}/api`

export interface ScheduleResponse {
  id: number
  doctorId: number
  dayOfWeek: number // 1-7 (Monday-Sunday)
  startTime: string // "HH:MM:SS"
  endTime: string // "HH:MM:SS"
  slotDurationMinutes: number
  validFrom: string | null // ISO date string
  validTo: string | null // ISO date string
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleRequest {
  doctorId: number
  dayOfWeek: number
  startTime: string // "HH:MM:SS"
  endTime: string // "HH:MM:SS"
  slotDurationMinutes: number
  validFrom?: string | null
  validTo?: string | null
}

export interface UpdateScheduleRequest {
  doctorId?: number
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  slotDurationMinutes?: number
  validFrom?: string | null
  validTo?: string | null
}

class SchedulesApiService {
  /**
   * Get all schedules for a specific doctor
   */
  async getSchedulesByDoctorId(doctorId: number): Promise<ScheduleResponse[]> {
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/admin/doctors/${doctorId}/schedules`
    console.log('SchedulesApiService.getSchedulesByDoctorId requesting', url)

    // Avoid sending a Content-Type header on GET requests to reduce CORS preflight
    const response = await fetch(url, { method: 'GET' })

    if (!response.ok) {
      // Try to read response body for better diagnostics
      let body = ''
      try {
        body = await response.text()
      } catch (e) {
        body = `<unable to read response body: ${String(e)}>`
      }
      const msg = `Failed to fetch schedules: HTTP ${response.status} ${response.statusText} - ${body} (url: ${url})`
      throw new Error(msg)
    }

    return response.json()
  }

  /**
   * Create a new schedule
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/admin/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create schedule: ${errorText || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: number, data: UpdateScheduleRequest): Promise<ScheduleResponse> {
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/admin/schedules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update schedule: ${errorText || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/admin/schedules/${id}`, { method: 'DELETE' })

    if (!response.ok) {
      throw new Error(`Failed to delete schedule: ${response.statusText}`)
    }
  }
}

export const schedulesApi = new SchedulesApiService()

