import { apiClient } from '@/lib/api'
import type { ScheduleResponse } from '@/services/schedulesApi'

/**
 * Staff Schedules API Service
 * Provides staff-scoped access to doctor schedules.
 */

const toPgTzString = (raw: any): string | null => {
  if (raw == null) return null
  const s = String(raw)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[+-]\d{2})?$/.test(s)) return s
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

const normalizeSchedule = (raw: any): ScheduleResponse => ({
  id: raw.id,
  doctor_id: raw.doctor_id ?? raw.doctorId,
  day_of_week: raw.day_of_week ?? raw.dayOfWeek,
  start_time: raw.start_time ?? raw.startTime,
  end_time: raw.end_time ?? raw.endTime,
  slot_duration_minutes: raw.slot_duration_minutes ?? raw.slotDurationMinutes,
  valid_from: toPgTzString(raw.valid_from ?? raw.validFrom ?? null),
  valid_to: toPgTzString(raw.valid_to ?? raw.validTo ?? null),
  created_at: raw.created_at ?? raw.createdAt ?? null,
  updated_at: raw.updated_at ?? raw.updatedAt ?? null
})

export const staffSchedulesApi = {
  /**
   * Get schedules for a doctor (staff-facing).
   * GET /api/staff/doctors/{doctorId}/schedules
   */
  async getSchedulesByDoctorId(doctorId: number): Promise<ScheduleResponse[]> {
    const response = await apiClient.get(`/api/staff/doctors/${doctorId}/schedules`)
    return Array.isArray(response) ? response.map(normalizeSchedule) : response
  }
}


