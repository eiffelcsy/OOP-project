import { apiClient } from '@/lib/api'

/**
 * Statistics API Service
 * Handles all HTTP requests to the Admin Statistics backend endpoints
 */

// Response types matching backend structure
export interface SystemMetrics {
  totalUsers: number
  activeClinics: number
  systemHealth: string
  healthStatus: 'good' | 'warning' | 'critical'
}

export interface SystemStatus {
  serverUptime: string
  uptimeDays: number
  databaseConnectivity: string
  dbStatus: 'good' | 'warning' | 'critical'
  lastBackup: string
  activeConnections: number
}

export interface QueueStats {
  currentWaiting: number
  averageWaitTime: string
  longestWait: string
  queueStatus: 'normal' | 'busy' | 'critical'
}

export interface SystemLoad {
  cpu: number
  memory: number
  diskUsage: number
  networkTraffic: string
}

export interface SystemUsage {
  appointmentsToday: number
  appointmentsThisWeek: number
  appointmentsTrend: string
  cancellationsToday: number
  cancellationRate: string
  queueStats: QueueStats
  systemLoad: SystemLoad
}

export interface SystemStatistics {
  metrics: SystemMetrics
  systemStatus: SystemStatus
  systemUsage: SystemUsage
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

