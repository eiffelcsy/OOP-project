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
    const response = await apiClient.get(`/api/admin/doctors/${doctorId}/schedules`)
    // Ensure valid_from/valid_to are presented in a Postgres-like
    // 'YYYY-MM-DD HH:MM:SS+00' UTC format when possible so callers
    // (and console logs) can see DB-style values.
    const toPgTzString = (raw: any): string | null => {
      if (raw == null) return null
      const s = String(raw)
      // If already in postgres-like format e.g. '2025-10-31 00:00:00+00', keep
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[+-]\d{2})?$/.test(s)) return s
      // Try parse as Date and format as UTC
      const d = new Date(s)
      if (isNaN(d.getTime())) return s
      const YYYY = d.getUTCFullYear()
      const MM = String(d.getUTCMonth() + 1).padStart(2, '0')
      const DD = String(d.getUTCDate()).padStart(2, '0')
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      const ss = String(d.getUTCSeconds()).padStart(2, '0')
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}+00`
    }

    try {
      if (Array.isArray(response)) {
        return response.map((r: any) => ({
          ...r,
          valid_from: toPgTzString(r.valid_from ?? r.validFrom ?? null),
          valid_to: toPgTzString(r.valid_to ?? r.validTo ?? null)
        })) as ScheduleResponse[]
      }
    } catch (_) {
      // fall back to returning original response if mapping fails
    }

    return response
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

