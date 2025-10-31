import { apiClient } from '@/lib/api'

/**
 * Statistics API Service
 * Handles all HTTP requests to the Admin Statistics backend endpoints
 */

// Response types matching backend structure (snake_case)
export interface SystemMetrics {
  total_users: number
  active_clinics: number
  system_health: string
  health_status: 'good' | 'warning' | 'critical'
}

export interface SystemStatus {
  server_uptime: string
  uptime_days: number
  database_connectivity: string
  db_status: 'good' | 'warning' | 'critical'
  last_backup: string
  active_connections: number
}

export interface QueueStats {
  current_waiting: number
  average_wait_time: string
  longest_wait: string
  queue_status: 'normal' | 'busy' | 'critical'
}

export interface SystemLoad {
  cpu: number
  memory: number
  disk_usage: number
  network_traffic: string
}

export interface SystemUsage {
  appointments_today: number
  appointments_this_week: number
  appointments_trend: string
  cancellations_today: number
  cancellation_rate: string
  queue_stats: QueueStats
  system_load: SystemLoad
}

export interface SystemStatistics {
  metrics: SystemMetrics
  system_status: SystemStatus
  system_usage: SystemUsage
}

export interface NewRegistrationsResponse {
  count: number
  hours: number
}

/**
 * Statistics API client
 */
export const statisticsApi = {
  /**
   * Get system-wide statistics
   * GET /api/admin/statistics
   */
  async getSystemStatistics(): Promise<SystemStatistics> {
    return apiClient.get('/api/admin/statistics')
  },

  /**
   * Get new registrations count
   * GET /api/admin/statistics/registrations
   */
  async getNewRegistrations(hours: number = 24): Promise<NewRegistrationsResponse> {
    return apiClient.get(`/api/admin/statistics/registrations?hours=${hours}`)
  }
}

