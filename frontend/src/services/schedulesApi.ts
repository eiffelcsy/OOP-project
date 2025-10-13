/**
 * Schedules API Service
 * Handles all schedule-related API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/schedules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a new schedule
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/schedules`, {
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
    const response = await fetch(`${API_BASE_URL}/api/admin/schedules/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/admin/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete schedule: ${response.statusText}`)
    }
  }
}

export const schedulesApi = new SchedulesApiService()

