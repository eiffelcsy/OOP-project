import { apiClient } from '@/lib/api'

/**
 * Schedules API Service
 * Handles all schedule-related API calls to the backend
 */

export interface ScheduleResponse {
  id: number
  doctor_id: number
  day_of_week: number // 1-7 (Monday-Sunday)
  start_time: string // "HH:MM:SS"
  end_time: string // "HH:MM:SS"
  slot_duration_minutes: number
  valid_from: string | null // ISO date string
  valid_to: string | null // ISO date string
  created_at: string
  updated_at: string
}

export interface CreateScheduleRequest {
  doctor_id: number
  day_of_week: number
  start_time: string // "HH:MM:SS"
  end_time: string // "HH:MM:SS"
  slot_duration_minutes: number
  valid_from?: string | null
  valid_to?: string | null
}

export interface UpdateScheduleRequest {
  doctor_id?: number
  day_of_week?: number
  start_time?: string
  end_time?: string
  slot_duration_minutes?: number
  valid_from?: string | null
  valid_to?: string | null
}

/**
 * Schedules API client
 */
export const schedulesApi = {
  /**
   * Get all schedules for a specific doctor
   * GET /api/admin/doctors/{doctorId}/schedules
   */
  async getSchedulesByDoctorId(doctorId: number): Promise<ScheduleResponse[]> {
    return apiClient.get(`/api/admin/doctors/${doctorId}/schedules`)
  },

  /**
   * Create a new schedule
   * POST /api/admin/schedules
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.post('/api/admin/schedules', data)
  },

  /**
   * Update an existing schedule
   * PUT /api/admin/schedules/{id}
   */
  async updateSchedule(id: number, data: UpdateScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.put(`/api/admin/schedules/${id}`, data)
  },

  /**
   * Delete a schedule
   * DELETE /api/admin/schedules/{id}
   */
  async deleteSchedule(id: number): Promise<void> {
    return apiClient.delete(`/api/admin/schedules/${id}`)
  }
}

